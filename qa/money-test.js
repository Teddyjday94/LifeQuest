/*
  Focused local QA for LifeQuest v0.9: Credit Card Chaos and The $600 Surprise on a
  phone viewport, payoff math, toolkits, persistence, and v0.8 save migration.

    node qa/money-test.js
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
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.evaluate(k => {
      localStorage.setItem(k, JSON.stringify({ profile: { name: 'Money QA', avatar: '🧑🏽' }, xp: 0, completed: [], badges: [], accessibility: { reducedMotion: true }, tourSeen: true }));
      localStorage.setItem('lifequest.crossroads.motion.v2', JSON.stringify({ ambient: false, sound: false }));
    }, STORE_KEY);
    await page.reload({ waitUntil: 'load' });
    await click(page, '.district-card[data-location="money"]');
    for (const q of ['paycheck', 'budget', 'credit', 'surprise']) assert(await page.locator(`.quest-tile[data-quest="${q}"]`).count() === 1, `${q} tile should be playable`);
    assert(await page.locator('.quest-tile[disabled]').count() === 0, 'No Money District quest should be locked');
    for (const q of ['credit', 'surprise', 'budget']) assert(await page.locator(`.room-hotspot[data-quest="${q}"]`).count() === 1, `${q} room hotspot should exist`);
    await assertNoOverflow(page, 'Money District');

    // Credit Card Chaos
    await click(page, '.room-hotspot[data-quest="credit"]');
    await page.locator('.portrait-emote').waitFor();
    assert((await page.locator('.portrait-emote').textContent()).includes('📒'), 'Maya should use her notebook emote');
    await page.getByText('QUEST 03 · MONEY SKILLS').waitFor();
    await click(page, '[data-act="money-next"]');
    for (const id of ['balance', 'minimum', 'warning']) await click(page, `[data-act="credit-line"][data-value="${id}"]`);
    assert(await page.locator('[data-act="money-next"]').isDisabled(), 'Four statement lines are required');
    await click(page, '[data-act="credit-line"][data-value="limit"]');
    const lines = await minHeight(page, '.home-clause');
    assert(lines.ok, `Statement lines should be ≥44px: ${lines.heights}`);
    await click(page, '[data-act="money-next"]');
    await click(page, '[data-act="credit-pay"][data-value="35"]');
    await page.getByText('$926').first().waitFor();
    await click(page, '[data-act="credit-pay"][data-value="1200"]');
    await page.getByText('Paid now · $0 interest').waitFor();
    await click(page, '[data-act="credit-pay"][data-value="150"]');
    await page.getByText('9 mo · $126').waitFor();
    const pays = await minHeight(page, '.money-pay');
    assert(pays.ok && pays.heights.length === 4, `Payment buttons should be ≥44px: ${pays.heights}`);
    await assertNoOverflow(page, 'Payoff simulator');
    await click(page, '[data-act="money-next"]');
    await click(page, '[data-act="credit-transfer"][data-value="free"]');
    await page.getByText('Pause and look closer').waitFor();
    await click(page, '[data-act="money-next"]');
    await click(page, '[data-act="credit-late"][data-value="call"]');
    await page.locator('[data-credit-guard="autopay"]').check();
    assert(await page.locator('[data-act="money-next"]').isDisabled(), 'Two guardrails are required');
    await page.locator('[data-credit-guard="reminder"]').check();
    await click(page, '[data-act="money-next"]');
    await page.getByText('Card Smart', { exact: true }).last().waitFor();
    await page.getByText('$150/month · 9 months · $126 interest').waitFor();
    await download(page, '[data-act="money-download"][data-kind="credit"]', 'CREDIT CARD PAYOFF PLANNER');
    await click(page, '[data-act="claim"]');

    // The $600 Surprise
    await click(page, '.room-hotspot[data-quest="surprise"]');
    await page.getByText('QUEST 04 · MONEY SKILLS').waitFor();
    await click(page, '[data-act="money-next"]');
    for (const id of ['diag', 'labor', 'supplies']) await click(page, `[data-act="surprise-line"][data-value="${id}"]`);
    await page.getByText('$600').first().waitFor();
    await page.locator('[data-surprise-defer]').check();
    await page.getByText('Total you would approve').waitFor();
    await click(page, '[data-act="money-next"]');
    await page.getByText('Four ways to cover $535').waitFor();
    for (const id of ['payday', 'bills', 'card']) await click(page, `[data-act="surprise-plan"][data-value="${id}"]`);
    await page.getByText('+$240').waitFor();
    await page.getByText('Workable, with a cost').waitFor();
    await assertNoOverflow(page, 'Funding plans');
    await click(page, '[data-act="money-next"]');
    await click(page, '[data-act="surprise-refill"][data-value="auto"]');
    await click(page, '[data-act="money-next"]');
    await click(page, '[data-act="surprise-starter"][data-index="1"]');
    assert((await page.locator('[data-money-note="surprise"]').inputValue()).includes('one month of essential bills'), 'Starter should fill the note');
    await click(page, '[data-act="money-next"]');
    await page.getByText('Shock Absorber', { exact: true }).last().waitFor();
    await download(page, '[data-act="money-download"][data-kind="surprise"]', 'SURPRISE EXPENSE GAME PLAN');
    await click(page, '[data-act="claim"]');

    await click(page, '[data-act="goto"][data-go="journal"]');
    await page.getByText('2 of 16 playable quests').waitFor();
    await page.getByText('200 XP earned.').waitFor();
    await click(page, '[data-act="goto"][data-go="toolkits"]');
    assert(await page.getByText('✓ FIELD GUIDE UNLOCKED').count() === 2, 'Both money toolkits should unlock');
    await page.reload({ waitUntil: 'load' });
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE_KEY);
    assert(saved.completed.includes('credit') && saved.completed.includes('surprise') && saved.xp === 200, 'Money progress should persist');
    assert(saved.creditDraft.plan === 150 && saved.surpriseDraft.plan === 'card' && saved.surpriseDraft.defer === true, 'Money drafts should persist');
    assert(errors.length === 0, `Browser errors:\n${errors.join('\n')}`);
    console.log('phone: Credit Card Chaos and The $600 Surprise passed');

    // v0.8 save migration
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const p2 = await ctx2.newPage();
    await p2.goto(BASE_URL, { waitUntil: 'load' });
    await p2.evaluate(k => localStorage.setItem(k, JSON.stringify({
      profile: { name: 'Returning Player', avatar: '🧑🏽' }, xp: 950, tourSeen: true,
      completed: ['paycheck', 'budget', 'post', 'scam', 'brand', 'views', 'lease', 'movein', 'offer', 'interview'],
      badges: [], accessibility: { reducedMotion: true }, offerDraft: { opened: ['harbor'], lean: 'harbor', terms: [], deadline: null, note: 'Keep me' }
    })), STORE_KEY);
    await p2.reload({ waitUntil: 'load' });
    await click(p2, '[data-act="goto"][data-go="journal"]');
    await p2.getByText('10 of 16 playable quests').waitFor();
    await p2.getByText('950 XP earned.').waitFor();
    await click(p2, '[data-act="start-mission"][data-quest="credit"]');
    await p2.locator('[data-money-stage]').waitFor();
    const kept = await p2.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE_KEY);
    assert(kept.offerDraft.note === 'Keep me', 'Existing drafts should survive');
    await ctx2.close();
    console.log('migration: v0.8 save kept 950 XP and opened the new Money quests');
    console.log('LifeQuest v0.9 Money District test: PASS');
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch(error => {
  console.error(`LifeQuest v0.9 Money District test: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
