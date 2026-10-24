/* Creates the v1.0 preview screenshots. Serve the folder locally or use the file URL default. */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const BASE_URL = process.env.LIFEQUEST_URL || pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const CHROME = process.env.LIFEQUEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE_KEY = 'lifequest.crossroads.prototype.v1';
const OUT = path.join(__dirname, '..');

async function click(page, selector) {
  const target = page.locator(selector).filter({ visible: true }).first();
  await target.waitFor({ state: 'visible' });
  await target.evaluate(element => element.click());
}
async function seed(page) {
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.evaluate(key => {
    localStorage.setItem(key, JSON.stringify({ profile: { name: 'Jordan', avatar: '🧑🏽' }, xp: 0, completed: [], badges: [], accessibility: { reducedMotion: true }, tourSeen: true }));
    localStorage.setItem('lifequest.crossroads.motion.v2', JSON.stringify({ ambient: false, sound: false }));
  }, STORE_KEY);
  await page.reload({ waitUntil: 'load' });
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: true });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await desktop.newPage();
    await seed(page);
    await shot(page, 'preview_desktop_map.png');
    await click(page, '[data-act="goto"][data-go="howto"]');
    await shot(page, 'preview_desktop_how_to_play.png');
    await click(page, '.howto-district [data-location="career"]');
    await shot(page, 'preview_desktop_career_tower.png');
    await click(page, '[data-act="start-mission"][data-quest="offer"]');
    await click(page, '[data-act="career-next"]');
    await click(page, '[data-act="offer-open"][data-value="lumen"]');
    await click(page, '[data-act="offer-open"][data-value="harbor"]');
    await shot(page, 'preview_desktop_offer_decoder.png');
    await click(page, '[data-act="location"][data-location="career"]');
    await click(page, '[data-act="start-mission"][data-quest="interview"]');
    await click(page, '[data-act="career-next"]');
    for (const id of ['people', 'preferred', 'pay', 'background']) await click(page, `[data-act="interview-post"][data-value="${id}"]`);
    await click(page, '[data-act="career-next"]');
    for (const [k, v] of [['s', 'strong'], ['t', 'big'], ['a', 'strong'], ['r', 'strong']]) await click(page, `[data-act="interview-star"][data-slot="${k}"][data-value="${v}"]`);
    await shot(page, 'preview_desktop_interview_star.png');
    await click(page, '[data-act="goto"][data-go="map"]');
    await click(page, '.district-card[data-location="money"]');
    await shot(page, 'preview_desktop_money_district.png');
    await click(page, '.quest-tile[data-quest="credit"]');
    await click(page, '[data-act="money-next"]');
    for (const id of ['balance', 'minimum', 'apr', 'warning']) await click(page, `[data-act="credit-line"][data-value="${id}"]`);
    await click(page, '[data-act="money-next"]');
    for (const amt of [35, 150, 75]) await click(page, `[data-act="credit-pay"][data-value="${amt}"]`);
    await shot(page, 'preview_desktop_credit_card_chaos.png');
    await click(page, '[data-act="location"][data-location="money"]');
    await click(page, '.quest-tile[data-quest="surprise"]');
    await click(page, '[data-act="money-next"]');
    for (const id of ['diag', 'labor', 'filter']) await click(page, `[data-act="surprise-line"][data-value="${id}"]`);
    await click(page, '[data-act="money-next"]');
    for (const id of ['payday', 'card', 'bills', 'mix']) await click(page, `[data-act="surprise-plan"][data-value="${id}"]`);
    await shot(page, 'preview_desktop_600_surprise.png');
    await click(page, '[data-act="goto"][data-go="map"]');
    await click(page, '.district-card[data-location="wellness"]');
    await shot(page, 'preview_desktop_wellness_center.png');
    await click(page, '.quest-tile[data-quest="health"]');
    await click(page, '[data-act="quest-next"]');
    for (const id of ['premium', 'deductible', 'copay', 'oop']) await click(page, `[data-act="health-term"][data-value="${id}"]`);
    await click(page, '[data-act="quest-next"]');
    for (const id of ['light', 'busy', 'big']) await click(page, `[data-act="health-year"][data-value="${id}"]`);
    await shot(page, 'preview_desktop_insurance_decoder.png');
    await click(page, '[data-act="goto"][data-go="map"]');
    await click(page, '.district-card[data-location="future"]');
    await shot(page, 'preview_desktop_future_district.png');
    await click(page, '.quest-tile[data-quest="retire"]');
    await click(page, '[data-act="quest-next"]');
    for (const id of ['401k', 'match', 'compound', 'fees']) await click(page, `[data-act="retire-term"][data-value="${id}"]`);
    await click(page, '[data-act="quest-next"]');
    await click(page, '[data-act="retire-age"][data-value="35"]');
    await click(page, '[data-act="retire-age"][data-value="45"]');
    await shot(page, 'preview_desktop_compound_curve.png');
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const phone = await mobile.newPage();
    await seed(phone);
    await click(phone, '[data-act="goto"][data-go="howto"]');
    await click(phone, '[data-act="tour-open"]');
    await phone.screenshot({ path: path.join(OUT, 'preview_mobile_welcome_tour.png') });
    await click(phone, '[data-act="tour-done"]');
    await shot(phone, 'preview_mobile_how_to_play.png');
    await mobile.close();
    console.log('LifeQuest v1.0 preview capture: PASS');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(`LifeQuest v1.0 preview capture: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
