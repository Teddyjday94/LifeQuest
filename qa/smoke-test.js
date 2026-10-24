/*
  Local-only LifeQuest v1.0 regression suite (all sixteen quests).

  Run while serving this folder locally (the default URL is http://127.0.0.1:8876/):
    node qa/smoke-test.js

  The script expects the Playwright package to be available and uses an existing
  local Chrome installation. It does not contact any external service.
*/

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const BASE_URL = process.env.LIFEQUEST_URL || pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const CHROME = process.env.LIFEQUEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE_KEY = 'lifequest.crossroads.prototype.v1';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function click(page, selector) {
  const target = page.locator(selector).filter({ visible: true }).first();
  await target.waitFor({ state: 'visible' });
  // DOM activation avoids headless Chromium waiting on decorative CSS motion.
  // Manual mouse/touch activation is covered in the companion browser pass.
  await target.evaluate(element => element.click());
}

async function onboard(page, name) {
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.locator('#new-name').fill(name);
  await click(page, '[data-act="avatar"][data-avatar="🧑🏿‍🦱"]');
  await click(page, '#onboard-form button[type="submit"]');
  await page.getByText(`Good news, ${name}!`).waitFor();
}

async function useReducedMotionForAutomation(page) {
  await page.evaluate(key => {
    const save = JSON.parse(localStorage.getItem(key));
    save.accessibility = { ...(save.accessibility || {}), reducedMotion: true };
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('lifequest.crossroads.motion.v2', JSON.stringify({ ambient: false, sound: false }));
  }, STORE_KEY);
  await page.reload({ waitUntil: 'load' });
}

async function startQuest(page, district, quest) {
  await click(page, '[data-act="goto"][data-go="map"]');
  await click(page, `[data-act="location"][data-location="${district}"]`);
  await click(page, `[data-act="start-mission"][data-quest="${quest}"]`);
}

async function finishPaycheck(page) {
  await startQuest(page, 'money', 'paycheck');
  await click(page, '[data-act="advance"]');
  await click(page, '[data-act="inspect"][data-term="federal"]');
  await page.getByText('Federal income-tax withholding').waitFor();
  await click(page, '[data-act="advance"]');
  await click(page, '[data-act="answer"][data-answer-key="money1"][data-value="932"]');
  await click(page, '[data-act="advance"]');
  await click(page, '[data-act="answer"][data-answer-key="money2"][data-value="check"]');
  await click(page, '[data-act="advance"]');
  await page.getByText('Net Pay Detective', { exact: true }).waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishBudget(page) {
  await startQuest(page, 'money', 'budget');
  await click(page, '[data-act="advance"]');
  assert(await page.locator('[data-act="budget-next"]').isEnabled(), 'Budget defaults should fit within $2,800');
  await click(page, '[data-act="budget-next"]');
  await click(page, '[data-act="budget-surprise"][data-value="savings"]');
  await page.getByText('This is exactly what an emergency fund is for.').waitFor();
  await click(page, '[data-act="advance"]');
  await page.getByText('Budget Boss', { exact: true }).last().waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishLease(page) {
  await startQuest(page, 'home', 'lease');
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="lease-listing"][data-value="juniper"]');
  await click(page, '[data-act="home-next"]');
  for (const id of ['term', 'utilities', 'fees', 'deposit']) await click(page, `[data-act="lease-clause"][data-value="${id}"]`);
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="lease-question"][data-value="written"]');
  await click(page, '[data-act="home-next"]');
  await page.locator('[data-home-note="lease"]').fill('Confirm recurring charges and renewal notice before signing.');
  await click(page, '[data-act="home-next"]');
  await page.getByText('HOME SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishMovein(page) {
  await startQuest(page, 'home', 'movein');
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="move-verify"][data-value="independent"]');
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="move-screen"][data-value="report"]');
  await click(page, '[data-act="home-next"]');
  for (const id of ['walls', 'water', 'smoke', 'keys']) await page.locator(`[data-home-check="${id}"]`).check();
  await click(page, '[data-act="home-next"]');
  await click(page, '[data-act="move-insurance"][data-value="compare"]');
  await click(page, '[data-act="move-maintenance"][data-value="written"]');
  await click(page, '[data-act="home-next"]');
  await page.getByText('Move-In Ready', { exact: true }).last().waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishPost(page) {
  await startQuest(page, 'studio', 'post');
  await click(page, '[data-act="advance"]');
  await click(page, '[data-act="answer"][data-answer-key="post1"][data-value="rewrite"]');
  await click(page, '[data-act="advance"]');
  await click(page, '[data-act="answer"][data-answer-key="post2"][data-value="disengage"]');
  await click(page, '[data-act="advance"]');
  await page.locator('#post-draft').fill('I am raising a scheduling concern through the appropriate private channel.');
  await click(page, '[data-act="advance"]');
  await page.getByText('Think Before You Post', { exact: true }).waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishScam(page) {
  await startQuest(page, 'studio', 'scam');
  await click(page, '[data-act="advance"]');
  for (const id of ['identity', 'fee', 'privacy', 'contract']) {
    await page.locator(`[data-scam-check="${id}"]`).check();
  }
  await click(page, '[data-act="scam-check-next"]');
  await click(page, '[data-act="answer"][data-answer-key="scam1"][data-value="verify"]');
  await click(page, '[data-act="advance"]');
  await click(page, '[data-act="answer"][data-answer-key="scam2"][data-value="check"]');
  await click(page, '[data-act="advance"]');
  await page.getByText('Scam Radar', { exact: true }).last().waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishBrand(page) {
  await startQuest(page, 'studio', 'brand');
  await click(page, '[data-act="advance"]');
  await page.locator('[data-brand-field="name"]').fill('QA Creator');
  await page.locator('[data-brand-field="handle"]').fill('@qa.creator');
  await page.locator('[data-brand-field="bio"]').fill('I create practical gaming lessons for curious new players.');
  await page.locator('[data-brand-field="cta"]').fill('See my latest lesson');
  await click(page, '[data-act="brand-profile-next"]');
  await click(page, '[data-act="brand-autofill"]');
  assert(await page.locator('[data-act="brand-plan-next"]').isEnabled(), 'Sample three-post plan should be valid');
  await click(page, '[data-act="brand-plan-next"]');
  await click(page, '[data-act="brand-obstacle"][data-value="reschedule"]');
  await click(page, '[data-act="advance"]');
  await page.getByText('Clear Signal', { exact: true }).waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishViews(page, { download = false } = {}) {
  await startQuest(page, 'studio', 'views');
  await click(page, '[data-act="views-next"]');
  await click(page, '[data-act="views-clip"][data-id="tip"]');
  await click(page, '[data-act="views-clip"][data-id="behind"]');
  await page.getByText('3 of 3 videos inspected').waitFor();
  await click(page, '[data-act="views-next"]');
  await click(page, '[data-act="views-hypothesis"][data-value="test"]');
  await page.getByText('It is a hypothesis, not a guarantee.').waitFor();
  await click(page, '[data-act="views-next"]');
  await click(page, '[data-act="views-edit"][data-group="hook"][data-value="moment"]');
  await click(page, '[data-act="views-edit"][data-group="structure"][data-value="demo"]');
  await click(page, '[data-act="views-edit"][data-group="caption"][data-value="clear"]');
  await click(page, '[data-act="views-next"]');
  await click(page, '[data-act="views-pressure"][data-value="learn"]');
  await page.getByText('protect the rest of your day').waitFor();
  await page.locator('[data-views-field="note"]').fill('Show the useful moment first and compare several posts.');
  await click(page, '[data-act="views-next"]');
  await page.getByText('Stay in the Game', { exact: true }).waitFor();

  if (download) {
    const transfer = page.waitForEvent('download');
    await click(page, '[data-act="views-download"]');
    const item = await transfer;
    const path = await item.path();
    const text = fs.readFileSync(path, 'utf8');
    assert(text.includes('LIFEQUEST FIELD GUIDE — STAY IN THE GAME'), 'Experiment download should contain the practical field guide');
    assert(text.includes('Show the useful moment first'), 'Experiment download should contain the player reflection');
  }

  await click(page, '[data-act="claim"]');
}

async function checkNoHorizontalOverflow(page, label) {
  const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  assert(width.scroll <= width.client + 1, `${label} has horizontal overflow: ${width.scroll}px > ${width.client}px`);
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

async function finishCredit(page) {
  await startQuest(page, 'money', 'credit');
  await page.locator('[data-money-stage]').waitFor();
  await click(page, '[data-act="money-next"]');
  for (const id of ['balance', 'minimum', 'due', 'apr']) await click(page, `[data-act="credit-line"][data-value="${id}"]`);
  await page.getByText('4 of 6 lines read').waitFor();
  await click(page, '[data-act="money-next"]');
  for (const amt of [35, 75, 150]) await click(page, `[data-act="credit-pay"][data-value="${amt}"]`);
  await page.getByText('61 mo · $926').waitFor();
  await click(page, '[data-act="money-next"]');
  await click(page, '[data-act="credit-transfer"][data-value="read"]');
  await page.getByText('$36', { exact: false }).first().waitFor();
  await click(page, '[data-act="money-next"]');
  await click(page, '[data-act="credit-late"][data-value="call"]');
  await page.locator('[data-credit-guard="autopay"]').check();
  await page.locator('[data-credit-guard="review"]').check();
  await click(page, '[data-act="money-next"]');
  await page.getByText('MONEY SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishSurprise(page) {
  await startQuest(page, 'money', 'surprise');
  await page.locator('[data-money-stage]').waitFor();
  await click(page, '[data-act="money-next"]');
  for (const id of ['diag', 'parts', 'filter']) await click(page, `[data-act="surprise-line"][data-value="${id}"]`);
  await page.locator('[data-surprise-defer]').check();
  await page.getByText('$535').first().waitFor();
  await click(page, '[data-act="money-next"]');
  for (const id of ['card', 'payday', 'mix']) await click(page, `[data-act="surprise-plan"][data-value="${id}"]`);
  await page.getByText('Smart next step').waitFor();
  await click(page, '[data-act="money-next"]');
  await click(page, '[data-act="surprise-refill"][data-value="auto"]');
  await click(page, '[data-act="money-next"]');
  await page.locator('[data-money-note="surprise"]').fill('Move $25 into savings every payday until it is back.');
  await click(page, '[data-act="money-next"]');
  await page.getByText('MONEY SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishOffer(page) {
  await startQuest(page, 'career', 'offer');
  await page.locator('[data-career-stage]').waitFor();
  await click(page, '[data-act="career-next"]');
  await click(page, '[data-act="offer-open"][data-value="lumen"]');
  await click(page, '[data-act="offer-open"][data-value="harbor"]');
  await page.getByText('$42,890').first().waitFor();
  await page.getByText('$40,896').first().waitFor();
  await click(page, '[data-act="career-next"]');
  for (const id of ['start', 'pay', 'benefits', 'agreements']) await click(page, `[data-act="offer-term"][data-value="${id}"]`);
  await page.getByText('4 of 6 terms reviewed').waitFor();
  await click(page, '[data-act="career-next"]');
  await click(page, '[data-act="offer-deadline"][data-value="clarify"]');
  await page.getByText('Strong move.', { exact: false }).waitFor();
  await click(page, '[data-act="career-next"]');
  await click(page, '[data-act="offer-starter"][data-index="0"]');
  assert((await page.locator('[data-career-note="offer"]').inputValue()).includes('weekend shifts'), 'Starter sentence should fill the reply');
  await click(page, '[data-act="career-next"]');
  await page.getByText('CAREER SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function finishInterview(page) {
  await startQuest(page, 'career', 'interview');
  await page.locator('[data-career-stage]').waitFor();
  await click(page, '[data-act="career-next"]');
  for (const id of ['people', 'preferred', 'pay', 'background']) await click(page, `[data-act="interview-post"][data-value="${id}"]`);
  await page.getByText('4 of 6 lines decoded').waitFor();
  await click(page, '[data-act="career-next"]');
  for (const k of ['s', 't', 'a', 'r']) await click(page, `[data-act="interview-star"][data-slot="${k}"][data-value="strong"]`);
  await page.getByText('4 of 4 parts strong', { exact: false }).waitFor();
  await click(page, '[data-act="career-next"]');
  await click(page, '[data-act="interview-pay"][data-value="range"]');
  await click(page, '[data-act="interview-family"][data-value="redirect"]');
  await page.getByText('EEOC', { exact: false }).first().waitFor();
  await click(page, '[data-act="career-next"]');
  await page.locator('[data-career-note="interview"]').fill('Thank you for meeting with me today. I enjoyed learning about the team.');
  await click(page, '[data-act="career-next"]');
  await page.getByText('CAREER SKILL UNLOCKED').waitFor();
  await click(page, '[data-act="claim"]');
}

async function freshPage(context, errors) {
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(`console: ${message.text()}`);
  });
  await page.goto(BASE_URL, { waitUntil: 'load' });
  return page;
}

async function runDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, acceptDownloads: true });
  const errors = [];
  let page = await freshPage(context, errors);

  await page.locator('#new-name').fill('QA Explorer');
  await click(page, '[data-act="avatar"][data-avatar="🧑🏿‍🦱"]');
  await click(page, '#onboard-form button[type="submit"]');
  await page.getByText('Good news, QA Explorer!').waitFor();
  await useReducedMotionForAutomation(page);
  console.log('desktop: onboarding passed');
  await finishPaycheck(page);
  console.log('desktop: Paycheck Mystery passed');
  await page.close(); page = await freshPage(context, errors);
  await finishBudget(page);
  console.log('desktop: Budget Boss passed');
  await page.close(); page = await freshPage(context, errors);
  await finishCredit(page);
  console.log('desktop: Credit Card Chaos passed');
  await page.close(); page = await freshPage(context, errors);
  await finishSurprise(page);
  console.log('desktop: The $600 Surprise passed');
  await page.close(); page = await freshPage(context, errors);
  await finishLease(page);
  console.log('desktop: Lease Detective passed');
  await page.close(); page = await freshPage(context, errors);
  await finishMovein(page);
  console.log('desktop: Move-In Ready passed');
  await page.close(); page = await freshPage(context, errors);
  await finishPost(page);
  console.log('desktop: Post or Pass passed');
  await page.close(); page = await freshPage(context, errors);
  await finishScam(page);
  console.log('desktop: Scam or Sponsor passed');
  await page.close(); page = await freshPage(context, errors);
  await finishBrand(page);
  console.log('desktop: Build Your Brand passed');
  await page.close(); page = await freshPage(context, errors);
  // The practical download is verified in the manual localhost pass. Headless
  // Chrome intentionally cancels Blob downloads from file:// pages.
  await finishViews(page);
  console.log('desktop: Views vs. Value passed');
  await page.close(); page = await freshPage(context, errors);
  await finishOffer(page);
  console.log('desktop: Offer Decoder passed');
  await page.close(); page = await freshPage(context, errors);
  await finishInterview(page);
  console.log('desktop: Interview Ready passed');
  for (const [fn, label] of [[finishHealth, 'Insurance Decoder'], [finishAppointment, 'Appointment Ready'], [finishRetire, 'Compound Curve'], [finishGoals, 'Goal Mapper']]) {
    await page.close(); page = await freshPage(context, errors);
    await fn(page);
    console.log(`desktop: ${label} passed`);
  }

  await click(page, '[data-act="goto"][data-go="journal"]');
  await page.getByText('16 of 16 playable quests').waitFor();
  await page.getByText('1550 XP earned.').waitFor();
  await checkNoHorizontalOverflow(page, 'Desktop journal');

  await click(page, '[data-act="goto"][data-go="toolkits"]');
  assert(await page.getByText('✓ FIELD GUIDE UNLOCKED').count() === 16, 'All sixteen field guides should unlock');

  await page.reload({ waitUntil: 'load' });
  await click(page, '[data-act="goto"][data-go="journal"]');
  await page.getByText('16 of 16 playable quests').waitFor();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORE_KEY);
  assert(saved.xp === 1550, `Expected 1550 persisted XP, received ${saved.xp}`);
  assert(saved.completed.length === 16, 'Expected sixteen persisted quest completions');
  assert(errors.length === 0, `Desktop emitted browser errors:\n${errors.join('\n')}`);
  await context.close();
  return 'desktop: 16 quests, rewards, toolkits and persistence passed';
}

async function runMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(`console: ${message.text()}`);
  });

  await onboard(page, 'Mobile QA');
  await useReducedMotionForAutomation(page);
  await finishViews(page);
  await checkNoHorizontalOverflow(page, 'Mobile mission return');

  const navHeights = await page.locator('.nav-btn').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().height)));
  assert(navHeights.every(height => height >= 44), `Mobile navigation targets should be at least 44px: ${navHeights.join(', ')}`);

  await startQuest(page, 'studio', 'views');
  await click(page, '[data-act="views-next"]');
  await click(page, '[data-act="views-clip"][data-id="tip"]');
  await click(page, '[data-act="views-clip"][data-id="behind"]');
  await click(page, '[data-act="views-next"]');
  await click(page, '[data-act="views-hypothesis"][data-value="test"]');
  await click(page, '[data-act="views-next"]');
  const optionHeights = await page.locator('.views-opt').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().height)));
  assert(optionHeights.length === 9 && optionHeights.every(height => height >= 44), `Mobile editor targets should be at least 44px: ${optionHeights.join(', ')}`);
  await checkNoHorizontalOverflow(page, 'Mobile analytics editor');
  assert(errors.length === 0, `Mobile emitted browser errors:\n${errors.join('\n')}`);
  await context.close();
  return 'mobile: full Views vs. Value flow, 44px targets and overflow checks passed';
}

async function runV06Migration(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({
    profile: { name: 'Returning Player', avatar: '🧑🏽' },
    xp: 550,
    completed: ['paycheck', 'budget', 'post', 'scam', 'brand', 'views'],
    badges: ['Net Pay Detective', 'Budget Boss', 'Think Before You Post', 'Scam Radar', 'Clear Signal', 'Stay in the Game'],
    accessibility: { reducedMotion: true }
  })), STORE_KEY);
  await page.reload({ waitUntil: 'load' });
  await click(page, '[data-act="goto"][data-go="journal"]');
  await page.getByText('6 of 16 playable quests').waitFor();
  await page.getByText('550 XP earned.').waitFor();
  await startQuest(page, 'home', 'lease');
  await page.locator('[data-home-stage]').waitFor();
  await context.close();
  return 'migration: v0.6 save opened Home Base without losing prior progress';
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  try {
    console.log(await runDesktop(browser));
    console.log(await runMobile(browser));
    console.log(await runV06Migration(browser));
    console.log('LifeQuest v1.0 smoke test: PASS');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(`LifeQuest v1.0 smoke test: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
