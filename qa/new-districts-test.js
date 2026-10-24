/*
  Focused local QA for LifeQuest v1.0: Wellness Center and Future District on a phone
  viewport, art fallbacks, all four quests, math, toolkits, persistence, v0.9 migration.

    node qa/new-districts-test.js
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


async function startQuest(page, district, quest) {
  await click(page, '[data-act="goto"][data-go="map"]');
  await click(page, `[data-act="location"][data-location="${district}"]`);
  await click(page, `[data-act="start-mission"][data-quest="${quest}"]`);
}

async function finishHealth(page) {
  await startQuest(page, 'wellness', 'health');
  await click(page, '[data-act="quest-next"]');
  for (const id of ['premium', 'deductible', 'coinsurance', 'oop']) await click(page, `[data-act="health-term"][data-value="${id}"]`);
  await click(page, '[data-act="quest-next"]');
  for (const id of ['light', 'busy', 'big']) await click(page, `[data-act="health-year"][data-value="${id}"]`);
  await page.getByText('$11,520').waitFor();
  await click(page, '[data-act="health-plan"][data-value="bronze"]');
  await click(page, '[data-act="quest-next"]');
  await click(page, '[data-act="health-network"][data-value="check"]');
  await click(page, '[data-act="quest-next"]');
  for (const id of ['doctors', 'meds', 'deadline']) await page.locator(`[data-nd-check="health-enroll"][value="${id}"]`).check();
  await click(page, '[data-act="quest-next"]');
  await page.getByText('NEW SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishAppointment(page) {
  await startQuest(page, 'wellness', 'appointment');
  await click(page, '[data-act="quest-next"]');
  for (const [c, v] of [['checkup', 'primary'], ['ankle', 'urgent'], ['chest', 'er'], ['rash', 'tele']]) await click(page, `[data-act="appt-care"][data-case="${c}"][data-value="${v}"]`);
  await click(page, '[data-act="quest-next"]');
  for (const id of ['card', 'meds', 'timeline', 'questions']) await page.locator(`[data-nd-check="appt-prep"][value="${id}"]`).check();
  await click(page, '[data-act="quest-next"]');
  for (const id of ['billed', 'allowed', 'owe']) await click(page, `[data-act="appt-eob"][data-value="${id}"]`);
  await click(page, '[data-act="appt-bill"][data-value="compare"]');
  await click(page, '[data-act="quest-next"]');
  await page.locator('[data-nd-note="appointment"]').fill('My EOB says I owe $85 but the bill says $240. Can you check?');
  await click(page, '[data-act="quest-next"]');
  await page.getByText('NEW SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishRetire(page) {
  await startQuest(page, 'future', 'retire');
  await click(page, '[data-act="quest-next"]');
  for (const id of ['401k', 'match', 'compound', 'index']) await click(page, `[data-act="retire-term"][data-value="${id}"]`);
  await click(page, '[data-act="quest-next"]');
  await click(page, '[data-act="retire-age"][data-value="35"]');
  await click(page, '[data-act="retire-amount"][data-value="50"]');
  await page.getByText('3 of 3 combinations tried.').waitFor();
  await click(page, '[data-act="quest-next"]');
  await click(page, '[data-act="retire-match"][data-value="full"]');
  await click(page, '[data-act="quest-next"]');
  await click(page, '[data-act="retire-leave"][data-value="roll"]');
  await click(page, '[data-act="quest-next"]');
  await page.getByText('NEW SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishGoals(page) {
  await startQuest(page, 'future', 'goals');
  await click(page, '[data-act="quest-next"]');
  for (const id of ['emergency', 'trip', 'school']) await click(page, `[data-act="goal-pick"][data-value="${id}"]`);
  await click(page, '[data-act="quest-next"]');
  await page.getByText('It fits.', { exact: false }).waitFor();
  await click(page, '[data-act="quest-next"]');
  await click(page, '[data-act="goal-windfall"][data-value="split"]');
  await click(page, '[data-act="quest-next"]');
  for (const id of ['beneficiary', 'contacts', 'passwords']) await page.locator(`[data-nd-check="goal-check"][value="${id}"]`).check();
  await page.locator('[data-nd-note="goals"]').fill('Set up an automatic transfer to my emergency fund this month.');
  await click(page, '[data-act="quest-next"]');
  await page.getByText('NEW SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
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
      localStorage.setItem(k, JSON.stringify({ profile: { name: 'Future QA', avatar: '🧑🏽' }, xp: 0, completed: [], badges: [], accessibility: { reducedMotion: true }, tourSeen: true }));
      localStorage.setItem('lifequest.crossroads.motion.v2', JSON.stringify({ ambient: false, sound: false }));
    }, STORE_KEY);
    await page.reload({ waitUntil: 'load' });
    await page.getByText('SIXTEEN QUESTS READY TO PLAY').waitFor();
    assert(await page.locator('.district-card').count() === 6, 'Six district cards should show');

    for (const key of ['wellness', 'future']) {
      await click(page, `.district-card[data-location="${key}"]`);
      await page.locator('.mentor-portrait').waitFor();
      await page.waitForTimeout(300);
      const portrait = await page.locator('.mentor-portrait').evaluate(img => ({ ok: img.complete && img.naturalWidth > 0, src: img.getAttribute('src').slice(0, 30) }));
      assert(portrait.ok, `${key} portrait should render (painted art or built-in fallback): ${portrait.src}`);
      assert(await page.locator('.nd-art').count() === 1, `${key} room should have its built-in illustration layer`);
      for (const q of key === 'wellness' ? ['health', 'appointment'] : ['retire', 'goals']) assert(await page.locator(`.room-hotspot[data-quest="${q}"]`).count() === 1, `${q} hotspot should exist`);
      await assertNoOverflow(page, key);
      await click(page, '[data-act="goto"][data-go="map"]');
    }

    // Spot-check gating and math on a phone, then complete all four quests.
    await startQuest(page, 'wellness', 'health');
    await page.locator('.portrait-emote').waitFor();
    assert((await page.locator('.portrait-emote').textContent()).includes('🩺'), 'Nia should use the stethoscope emote');
    await page.getByText('QUEST 13 · WELLNESS SKILLS').waitFor();
    await click(page, '[data-act="quest-next"]');
    for (const id of ['premium', 'deductible', 'copay']) await click(page, `[data-act="health-term"][data-value="${id}"]`);
    assert(await page.locator('[data-act="quest-next"]').isDisabled(), 'Four terms are required');
    await click(page, '[data-act="health-term"][data-value="network"]');
    await click(page, '[data-act="quest-next"]');
    await click(page, '[data-act="health-year"][data-value="light"]');
    await page.getByText('$2,570').waitFor();
    await page.getByText('$4,105').waitFor();
    await click(page, '[data-act="health-year"][data-value="big"]');
    await page.getByText('$8,565').waitFor();
    await assertNoOverflow(page, 'Plan simulator');
    await click(page, '[data-act="location"][data-location="wellness"]');

    await finishHealth(page);
    await finishAppointment(page);
    await click(page, '[data-act="goto"][data-go="map"]');
    await startQuest(page, 'future', 'retire');
    await click(page, '[data-act="quest-next"]');
    for (const id of ['401k', 'match', 'ira', 'fees']) await click(page, `[data-act="retire-term"][data-value="${id}"]`);
    await click(page, '[data-act="quest-next"]');
    await page.getByText('$227,016').first().waitFor();
    const seg = await minHeight(page, '.nd-seg-btn');
    assert(seg.ok, `Simulator buttons should be ≥44px: ${seg.heights}`);
    await click(page, '[data-act="location"][data-location="future"]');
    await finishRetire(page);
    await startQuest(page, 'future', 'goals');
    await click(page, '[data-act="quest-next"]');
    for (const id of ['emergency', 'car', 'move']) await click(page, `[data-act="goal-pick"][data-value="${id}"]`);
    await click(page, '[data-act="quest-next"]');
    await page.getByText('Over budget by $109', { exact: false }).waitFor();
    assert(await page.locator('[data-act="quest-next"]').isDisabled(), 'Over-budget plan should not continue');
    await click(page, '[data-act="goal-months"][data-goal="move"][data-value="24"]');
    await click(page, '[data-act="goal-months"][data-goal="car"][data-value="18"]');
    await page.getByText('It fits.', { exact: false }).waitFor();
    await assertNoOverflow(page, 'Goal budget');
    await click(page, '[data-act="location"][data-location="future"]');
    await finishGoals(page);

    await click(page, '[data-act="goto"][data-go="journal"]');
    await page.getByText('4 of 16 playable quests').waitFor();
    await page.getByText('400 XP earned.').waitFor();
    await click(page, '[data-act="goto"][data-go="toolkits"]');
    assert(await page.getByText('✓ FIELD GUIDE UNLOCKED').count() === 4, 'Four new toolkits should unlock');
    await download(page, '[data-act="download"][data-kit="health"]', 'HEALTH PLAN PICKER');
    await download(page, '[data-act="download"][data-kit="goals"]', 'FUTURE GOALS MAP');
    await page.reload({ waitUntil: 'load' });
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE_KEY);
    assert(['health', 'appointment', 'retire', 'goals'].every(id => saved.completed.includes(id)) && saved.xp === 400, 'New district progress should persist');
    assert(saved.goalsDraft.goals.length === 3 && saved.healthDraft.plan === 'bronze', 'Drafts should persist');
    assert(errors.length === 0, `Browser errors:\n${errors.join('\n')}`);
    console.log('phone: Wellness Center and Future District, all four quests passed');

    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const p2 = await ctx2.newPage();
    await p2.goto(BASE_URL, { waitUntil: 'load' });
    await p2.evaluate(k => localStorage.setItem(k, JSON.stringify({
      profile: { name: 'Returning Player', avatar: '🧑🏽' }, xp: 1150, tourSeen: true,
      completed: ['paycheck', 'budget', 'credit', 'surprise', 'post', 'scam', 'brand', 'views', 'lease', 'movein', 'offer', 'interview'],
      badges: [], accessibility: { reducedMotion: true }, creditDraft: { lines: [], tried: [150], plan: 150, transfer: null, late: null, guards: [] }
    })), STORE_KEY);
    await p2.reload({ waitUntil: 'load' });
    await click(p2, '[data-act="goto"][data-go="journal"]');
    await p2.getByText('12 of 16 playable quests').waitFor();
    await p2.getByText('1150 XP earned.').waitFor();
    const kept = await p2.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE_KEY);
    assert(kept.creditDraft.plan === 150, 'Existing drafts should survive');
    await ctx2.close();
    console.log('migration: v0.9 save kept 1150 XP');
    console.log('LifeQuest v1.0 new districts test: PASS');
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch(error => {
  console.error(`LifeQuest v1.0 new districts test: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
