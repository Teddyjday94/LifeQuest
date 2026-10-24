/* Focused local QA for the LifeQuest v0.7 Home Base chapter. */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const BASE_URL = process.env.LIFEQUEST_URL || pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const CHROME = process.env.LIFEQUEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE_KEY = 'lifequest.crossroads.prototype.v1';

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function click(page, selector) {
  const target = page.locator(selector).filter({ visible: true }).first();
  await target.waitFor({ state: 'visible' });
  await target.evaluate(element => element.click());
}

async function onboard(page) {
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.locator('#new-name').fill('Home QA');
  await click(page, '[data-act="avatar"][data-avatar="🧑🏿‍🦱"]');
  await click(page, '#onboard-form button[type="submit"]');
  await page.getByText('Good news, Home QA!').waitFor();
  await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key));
    state.accessibility = { reducedMotion: true };
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem('lifequest.crossroads.motion.v2', JSON.stringify({ ambient: false, sound: false }));
  }, STORE_KEY);
  await page.reload({ waitUntil: 'load' });
}

async function assertNoOverflow(page, label) {
  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  assert(widths.scroll <= widths.client + 1, `${label} overflowed: ${widths.scroll}px > ${widths.client}px`);
}

async function finishLease(page) {
  await click(page, '[data-act="start-mission"][data-quest="lease"]');
  await page.locator('[data-home-stage]').waitFor();
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="lease-listing"][data-value="juniper"]');
  await page.getByText('a real trade-off', { exact: false }).waitFor();
  await click(page, '[data-act="home-next"]');
  for (const id of ['term', 'utilities', 'fees', 'deposit']) await click(page, `[data-act="lease-clause"][data-value="${id}"]`);
  await page.getByText('4 of 6 clauses reviewed').waitFor();
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="lease-question"][data-value="written"]');
  await page.getByText('Strong move.', { exact: false }).waitFor();
  await click(page, '[data-act="home-next"]');
  await page.locator('[data-home-note="lease"]').fill('Confirm every recurring charge and the renewal notice in writing.');
  await click(page, '[data-act="home-next"]');
  await page.getByText('HOME SKILL UNLOCKED').waitFor();
  const transfer = page.waitForEvent('download');
  await click(page, '[data-act="home-download"][data-kind="lease"]');
  const download = await transfer;
  assert(fs.readFileSync(await download.path(), 'utf8').includes('LEASE READY CHECKLIST'), 'Lease toolkit should contain its practical checklist');
  await click(page, '[data-act="claim"]');
}

async function finishMovein(page) {
  await click(page, '[data-act="start-mission"][data-quest="movein"]');
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="move-verify"][data-value="independent"]');
  await page.getByText('That reduces uncertainty.', { exact: false }).waitFor();
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="move-screen"][data-value="report"]');
  await page.getByText('federal consumer law', { exact: false }).waitFor();
  await page.getByText('Fair housing check', { exact: false }).waitFor();
  await click(page, '[data-act="home-next"]');
  for (const id of ['walls', 'water', 'smoke', 'keys']) await page.locator(`[data-home-check="${id}"]`).check();
  await page.getByText('4 of 4 condition actions recorded').waitFor();
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="move-insurance"][data-value="compare"]');
  await click(page, '[data-act="move-maintenance"][data-value="written"]');
  await page.getByText('Clear documentation helps', { exact: false }).waitFor();
  await click(page, '[data-act="home-next"]');
  await page.getByText('Move-In Ready', { exact: true }).last().waitFor();
  const transfer = page.waitForEvent('download');
  await click(page, '[data-act="home-download"][data-kind="movein"]');
  const download = await transfer;
  assert(fs.readFileSync(await download.path(), 'utf8').includes('MOVE-IN RECORD KIT'), 'Move-in toolkit should contain its practical record kit');
  await click(page, '[data-act="claim"]');
}

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await onboard(page);
    await click(page, '[data-act="goto"][data-go="map"]');
    const home = page.locator('[data-act="location"][data-location="home"]');
    assert(await home.count() >= 1, `Home Base should be an enabled map destination. Browser errors: ${errors.join(' | ') || 'none'}`);
    await click(page, '[data-act="location"][data-location="home"]');
    await page.locator('[data-act="start-mission"][data-quest="lease"]').first().waitFor();
    assert(await page.locator('[data-act="start-mission"][data-quest="lease"]').count() >= 1, 'Lease Detective should be playable');
    assert(await page.locator('[data-act="start-mission"][data-quest="movein"]').count() >= 1, 'Move-In Ready should be playable');
    assert(await page.getByText('André Bell', { exact: true }).count() >= 1, 'Home Base should use André’s correct name');
    await assertNoOverflow(page, 'Home Base district');

    await click(page, '[data-act="start-mission"][data-quest="lease"]');
    await page.locator('[data-home-stage]').waitFor();
    await page.locator('.portrait-emote').waitFor();
    assert((await page.locator('.portrait-emote').textContent()).includes('🔑'), 'André should use the Home Base key emote');
    assert(await page.getByText('Lease Detective', { exact: false }).count() >= 1, 'Lease Detective should identify the mission');
    await assertNoOverflow(page, 'Lease mission');
    await click(page, '[data-act="home-next"]');
    const touchTargets = await page.locator('.home-choice,.home-listing,.home-clause').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().height)));
    assert(touchTargets.length > 0 && touchTargets.every(height => height >= 44), `Home controls should be at least 44px: ${touchTargets.join(', ')}`);

    await click(page, '[data-act="location"][data-location="home"]');
    await page.locator('[data-act="start-mission"][data-quest="lease"]').first().waitFor();
    await finishLease(page);
    await page.getByText('1/2 complete').waitFor();
    await finishMovein(page);
    await page.getByText('2/2 complete').waitFor();

    await click(page, '[data-act="goto"][data-go="journal"]');
    await page.getByText('2 of 16 playable quests').waitFor();
    await page.getByText('200 XP earned.').waitFor();
    await click(page, '[data-act="goto"][data-go="toolkits"]');
    assert(await page.getByText('✓ FIELD GUIDE UNLOCKED').count() === 2, 'Both Home Base toolkits should unlock');
    await page.reload({ waitUntil: 'load' });
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORE_KEY);
    assert(saved.xp === 200, `Expected 200 Home Base XP, received ${saved.xp}`);
    assert(saved.completed.includes('lease') && saved.completed.includes('movein'), 'Home Base completion should persist');
    assert(saved.leaseDraft.note.includes('renewal notice'), 'Lease comparison note should persist');
    await assertNoOverflow(page, 'Home Base toolkit');
    assert(errors.length === 0, `Home Base emitted errors:\n${errors.join('\n')}`);
    console.log('LifeQuest v0.7 Home Base focused test: PASS');
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch(error => {
  console.error(`LifeQuest v0.7 Home Base focused test: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});

