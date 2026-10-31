const assert = require('assert');
const { chromium } = require('playwright');

const BASE_URL = process.env.LIFEQUEST_URL || 'http://127.0.0.1:8897/';
const CHROME = process.env.LIFEQUEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE_KEY = 'lifequest.crossroads.prototype.v1';

async function seed(page, options = {}) {
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.evaluate(({ key, reducedMotion }) => {
    localStorage.setItem(key, JSON.stringify({
      profile: { name: 'Living Storybook QA', avatar: '🧑🏽' },
      xp: 0,
      completed: [],
      badges: [],
      accessibility: { reducedMotion: Boolean(reducedMotion) }
    }));
    localStorage.setItem('lifequest.crossroads.motion.v2', JSON.stringify({ ambient: true, sound: false }));
  }, { key: STORE_KEY, reducedMotion: options.reducedMotion });
  await page.reload({ waitUntil: 'load' });
  await page.locator('.below-town').waitFor({ state: 'visible' });
}

async function clickVisible(page, selector) {
  const target = page.locator(selector).filter({ visible: true }).first();
  await target.waitFor({ state: 'visible' });
  await target.evaluate(element => element.click());
}

async function returnToMap(page) {
  await clickVisible(page, '.nav-btn[data-act="goto"][data-go="map"]');
  await page.locator('.town-life-layer').waitFor();
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const externalRequests = [];
    const pageErrors = [];
    const origin = new URL(BASE_URL).origin;
    page.on('request', request => {
      const url = request.url();
      if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:')) externalRequests.push(url);
    });
    page.on('pageerror', error => pageErrors.push(error.message));
    await seed(page);

    assert.equal(await page.title(), 'LifeQuest v1.2 | Illustrated Crossroads');
    assert.equal(await page.locator('.district-card').count(), 6, 'all six v1.0 districts must remain');
    assert.equal(await page.locator('.below-town').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(/\s+/).length), 6, 'desktop district strip should use six columns');
    assert.equal(await page.locator('.map-ambient-v10').count(), 1, 'living-world scenery should insert once');
    assert.equal(await page.locator('.town-life-layer').count(), 1, 'town-life layer should insert once');
    assert.equal(await page.locator('.town-life-layer .town-walker').count(), 4, 'town should include four residents');
    assert.equal(await page.locator('.town-life-layer .town-walker, .town-life-layer .town-service-vehicle').count(), 5, 'town actors should remain capped at five');
    assert.equal(await page.locator('.map-chip .map-chip-anchor').count(), 6, 'all six map destinations should be anchored');
    assert.equal(await page.locator('.town-life-layer').getAttribute('aria-hidden'), 'true');

    const districts = [
      ['money', 'money-chart-glow'],
      ['studio', 'studio-neon-breathe'],
      ['home', 'home-window-warmth'],
      ['career', 'career-page-settle'],
      ['wellness', 'wellness-monitor-calm'],
      ['future', 'career-page-settle']
    ];
    for (const [kind, signature] of districts) {
      await clickVisible(page, `[data-act="location"][data-location="${kind}"]`);
      const room = page.locator('.room-canvas').first();
      await room.waitFor({ state: 'visible' });
      assert.equal(await room.getAttribute('data-district-kind'), kind, `${kind} should retain its district identity`);
      assert.equal(await room.locator('.room-atmosphere-v10').count(), 1, `${kind} should have one Living Storybook layer`);
      assert.equal(await room.locator(`.${signature}`).count(), 1, `${kind} should have its signature atmosphere`);
      await returnToMap(page);
    }

    await clickVisible(page, '[data-act="location"][data-location="future"]');
    await clickVisible(page, '[data-act="start-mission"][data-quest="retire"]');
    await page.locator('.mission-scene').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.mission-scene .scene-character').getAttribute('data-guide'), 'sam', 'Sam should retain a distinct guide state');
    assert.equal(await page.locator('.mission-scene .scene-character').getAttribute('data-lq-character'), 'enhanced');
    assert.deepEqual(externalRequests, [], `standalone build should make no external requests: ${externalRequests.join(', ')}`);
    assert.deepEqual(pageErrors, [], `Living Storybook navigation should not produce page errors: ${pageErrors.join('; ')}`);
    await context.close();

    const reduced = await browser.newContext({ viewport: { width: 1200, height: 900 } });
    const reducedPage = await reduced.newPage();
    await seed(reducedPage, { reducedMotion: true });
    assert.equal(await reducedPage.locator('body.reduced-motion').count(), 1, 'saved reduced motion should remain active');
    assert.equal(await reducedPage.locator('.town-sky-light').evaluate(element => getComputedStyle(element).animationPlayState), 'paused');
    await reduced.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mobilePage = await mobile.newPage();
    await seed(mobilePage);
    assert.equal(await mobilePage.locator('.below-town').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(/\s+/).length), 2, 'phone district strip should use two columns');
    assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'phone map should not overflow');
    const pixelBox = await mobilePage.locator('.pixel-hello').boundingBox();
    assert.equal(Boolean(pixelBox && pixelBox.width >= 44 && pixelBox.height >= 44), true, `Ask Pixel should remain a 44px touch target: ${JSON.stringify(pixelBox)}`);
    await mobile.close();

    console.log('LifeQuest v1.1 Living Storybook integration test: PASS');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(`LifeQuest v1.1 Living Storybook integration test: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
