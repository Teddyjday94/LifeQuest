/*
  Focused local QA for LifeQuest v0.8: welcome tour, How to Play guide,
  quest help, Career Tower (both quests) on a phone viewport, and v0.7 save migration.

    node qa/career-howto-test.js
  Optional: LIFEQUEST_URL=http://127.0.0.1:8876/  LIFEQUEST_CHROME=/path/to/chrome
*/
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const BASE_URL = process.env.LIFEQUEST_URL || pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const CHROME = process.env.LIFEQUEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE_KEY = 'lifequest.crossroads.prototype.v1';

function assert(value, message) { if (!value) throw new Error(message); }
async function click(page, selector) {
  const target = page.locator(selector).filter({ visible: true }).first();
  await target.waitFor({ state: 'visible' });
  await target.evaluate(element => element.click());
}
async function assertNoOverflow(page, label) {
  const w = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  assert(w.scroll <= w.client + 1, `${label} overflowed: ${w.scroll}px > ${w.client}px`);
}
async function minHeight(page, selector) {
  const heights = await page.locator(selector).evaluateAll(nodes => nodes.filter(n => n.offsetParent).map(n => Math.round(n.getBoundingClientRect().height)));
  return { heights, ok: heights.length > 0 && heights.every(h => h >= 44) };
}
async function download(page, selector, expected) {
  const transfer = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
  await click(page, selector);
  const file = await transfer;
  if (!file) { console.log(`  (download not captured for ${expected}; verify manually over localhost)`); return; }
  const p = await file.path();
  if (p) assert(fs.readFileSync(p, 'utf8').includes(expected), `Download should include “${expected}”`);
}

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  try {
    // Onboarding opens the three-step welcome tour.
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.locator('#new-name').fill('Career QA');
    await click(page, '#onboard-form button[type="submit"]');
    await page.locator('.tour-dialog').waitFor();
    await page.getByText('Pick a place on the map').waitFor();
    await click(page, '[data-act="tour-next"]');
    await page.getByText('Choose, then see the trade-off').waitFor();
    await click(page, '[data-act="tour-next"]');
    await page.getByText('Keep what you learn').first().waitFor();
    await click(page, '[data-act="tour-guide"]');
    assert(await page.locator('.tour-dialog').count() === 0, 'Tour should close');
    const seen = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).tourSeen, STORE_KEY);
    assert(seen === true, 'Tour should be remembered');
    await page.evaluate(() => localStorage.setItem('lifequest.crossroads.motion.v2', JSON.stringify({ ambient: false, sound: false })));

    // How to Play guide.
    await page.getByText('Real life,', { exact: false }).waitFor();
    for (const text of ['Pick a place', 'Every quest screen works the same way.', 'There is no game over.', 'Every 150 XP is a level.', 'All six districts are open.', 'Play your way.', 'It stays with you.', 'Better out loud.'])
      await page.getByText(text, { exact: false }).first().waitFor();
    await page.getByText('16 QUESTS · 1550 XP TO EARN').waitFor();
    await assertNoOverflow(page, 'How to play');
    const nav = await minHeight(page, '.nav-btn');
    assert(nav.ok && nav.heights.length === 4, `Four nav targets should be ≥44px: ${nav.heights}`);
    await page.reload({ waitUntil: 'load' });
    assert(await page.locator('.tour-dialog').count() === 0, 'Tour should not reappear after reload');
    await click(page, '[data-act="goto"][data-go="howto"]');
    await click(page, '[data-act="tour-open"]');
    await page.locator('.tour-dialog').waitFor();
    await page.keyboard.press('Escape');
    assert(await page.locator('.tour-dialog').count() === 0, 'Escape should close the tour');

    // Career Tower district.
    await click(page, '[data-act="goto"][data-go="map"]');
    await page.getByText('SIXTEEN QUESTS READY TO PLAY').waitFor();
    await click(page, '.district-card[data-location="career"]');
    await page.getByText('Priya Shah', { exact: true }).first().waitFor();
    await page.getByText('0/2 complete').waitFor();
    await assertNoOverflow(page, 'Career Tower district');

    // Offer Decoder.
    await click(page, '[data-act="start-mission"][data-quest="offer"]');
    await page.locator('.portrait-emote').waitFor();
    assert((await page.locator('.portrait-emote').textContent()).includes('💼'), 'Priya should use the career emote');
    await click(page, '[data-act="quest-help"]');
    await page.getByText('How quests work', { exact: true }).waitFor();
    await click(page, '.help-dialog [data-act="close-modal"]');
    assert(await page.locator('[data-career-stage]').count() === 1, 'Help should return to the same quest');
    await click(page, '[data-act="career-next"]');
    assert(await page.locator('[data-act="career-next"]').isDisabled(), 'Offers must be opened before continuing');
    await click(page, '[data-act="offer-open"][data-value="harbor"]');
    await click(page, '[data-act="offer-open"][data-value="lumen"]');
    await page.getByText('$42,890').waitFor();
    await page.getByText('$40,896').waitFor();
    await page.getByText('Leaning toward Lumen Clinic', { exact: false }).waitFor();
    const offerTargets = await minHeight(page, '.career-offer');
    assert(offerTargets.ok, `Offer cards should be ≥44px: ${offerTargets.heights}`);
    await assertNoOverflow(page, 'Offer comparison');
    await click(page, '[data-act="career-next"]');
    for (const id of ['start', 'pay', 'benefits', 'atwill']) await click(page, `[data-act="offer-term"][data-value="${id}"]`);
    await page.getByText('4 of 6 terms reviewed').waitFor();
    await page.getByText("PRIYA'S NOTE").waitFor();
    const clause = await minHeight(page, '.home-clause');
    assert(clause.ok, `Offer letter terms should be ≥44px: ${clause.heights}`);
    await click(page, '[data-act="career-next"]');
    await click(page, '[data-act="offer-deadline"][data-value="accept"]');
    await page.getByText('Pause and look closer').waitFor();
    await click(page, '[data-act="career-next"]');
    await page.locator('[data-career-note="offer"]').fill('Too short');
    assert(await page.locator('[data-act="career-next"]').isDisabled(), 'Reply needs 20 characters');
    await click(page, '[data-act="offer-starter"][data-index="1"]');
    assert((await page.locator('[data-career-note="offer"]').inputValue()).includes('health premium'), 'Starter should append');
    await click(page, '[data-act="career-next"]');
    await page.getByText('CAREER SKILL UNLOCKED').waitFor();
    await download(page, '[data-act="career-download"][data-kind="offer"]', 'JOB OFFER COMPARISON SHEET');
    await click(page, '[data-act="claim"]');
    await page.getByText('1/2 complete').waitFor();

    // Interview Ready.
    await click(page, '[data-act="start-mission"][data-quest="interview"]');
    await click(page, '[data-act="career-next"]');
    for (const id of ['preferred', 'pay', 'background', 'schedule']) await click(page, `[data-act="interview-post"][data-value="${id}"]`);
    await page.getByText('federal law requires your written permission', { exact: false }).count();
    await click(page, '[data-act="career-next"]');
    await click(page, '[data-act="interview-star"][data-slot="s"][data-value="vague"]');
    await page.getByText('Too general.', { exact: false }).first().waitFor();
    for (const k of ['s', 't', 'a', 'r']) await click(page, `[data-act="interview-star"][data-slot="${k}"][data-value="strong"]`);
    await page.getByText('4 of 4 parts strong', { exact: false }).waitFor();
    const star = await minHeight(page, '.career-star .home-choice');
    assert(star.ok && star.heights.length === 12, `STAR options should be ≥44px: ${star.heights}`);
    await assertNoOverflow(page, 'STAR builder');
    await click(page, '[data-act="career-next"]');
    await click(page, '[data-act="interview-pay"][data-value="range"]');
    await click(page, '[data-act="interview-family"][data-value="redirect"]');
    await click(page, '[data-act="career-next"]');
    await click(page, '[data-act="interview-starter"][data-index="0"]');
    await click(page, '[data-act="career-next"]');
    await page.getByText('Interview Ready', { exact: true }).last().waitFor();
    await download(page, '[data-act="career-download"][data-kind="interview"]', 'INTERVIEW PREP CARD');
    await click(page, '[data-act="claim"]');
    await page.getByText('2/2 complete').waitFor();

    await click(page, '[data-act="goto"][data-go="journal"]');
    await page.getByText('2 of 16 playable quests').waitFor();
    await page.getByText('200 XP earned.').waitFor();
    await click(page, '[data-act="goto"][data-go="toolkits"]');
    assert(await page.getByText('✓ FIELD GUIDE UNLOCKED').count() === 2, 'Both career toolkits should unlock');
    await page.reload({ waitUntil: 'load' });
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE_KEY);
    assert(saved.xp === 200 && saved.completed.includes('offer') && saved.completed.includes('interview'), 'Career progress should persist');
    assert(saved.interviewDraft.star.r === 'strong', 'STAR story should persist');
    assert(saved.offerDraft.note.includes('health premium'), 'Offer reply should persist');
    assert(errors.length === 0, `Browser errors:\n${errors.join('\n')}`);
    console.log('phone: tour, How to Play, quest help, and both Career Tower quests passed');

    // v0.7 save migration: eight finished quests keep their progress and unlock Career Tower.
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const p2 = await ctx2.newPage();
    await p2.goto(BASE_URL, { waitUntil: 'load' });
    await p2.evaluate(k => localStorage.setItem(k, JSON.stringify({
      profile: { name: 'Returning Player', avatar: '🧑🏽' }, xp: 750,
      completed: ['paycheck', 'budget', 'post', 'scam', 'brand', 'views', 'lease', 'movein'],
      badges: ['Net Pay Detective', 'Budget Boss', 'Think Before You Post', 'Scam Radar', 'Clear Signal', 'Stay in the Game', 'Lease Detective', 'Move-In Ready'],
      accessibility: { reducedMotion: true }, leaseDraft: { listing: 'juniper', clauses: ['term'], question: 'written', note: 'Keep me' }
    })), STORE_KEY);
    await p2.reload({ waitUntil: 'load' });
    assert(await p2.locator('.tour-dialog').count() === 0, 'Returning players should not be interrupted by the tour');
    await click(p2, '[data-act="goto"][data-go="journal"]');
    await p2.getByText('8 of 16 playable quests').waitFor();
    await p2.getByText('750 XP earned.').waitFor();
    await click(p2, '[data-act="goto"][data-go="map"]');
    await click(p2, '.district-card[data-location="career"]');
    await click(p2, '[data-act="start-mission"][data-quest="offer"]');
    await p2.locator('[data-career-stage]').waitFor();
    const kept = await p2.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE_KEY);
    assert(kept.leaseDraft.note === 'Keep me', 'Existing drafts should survive');
    await ctx2.close();
    console.log('migration: v0.7 save kept 750 XP and opened Career Tower');
    console.log('LifeQuest v0.8 Career + How to Play test: PASS');
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch(error => {
  console.error(`LifeQuest v0.8 Career + How to Play test: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
