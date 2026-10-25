/* eslint-disable @typescript-eslint/no-require-imports -- Isolated browser smoke runner. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const out = path.resolve(__dirname, '../../.impeccable/review/landing-visual');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const paths = ['/pengukuran', '/instruksi', '/rencana'];
    for (const width of [320, 390, 768, 1024, 1440]) {
      console.log(`Checking landing visual at ${width}px`);
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => document.querySelector('.landing-reading-progress')?.style.transform);
      await page.waitForFunction(() => document.querySelector('.landing-site img')?.naturalWidth > 0);
      assert.ok(await page.locator('.landing-site img').evaluate(img => img.naturalWidth > 0));
      const original = await page.evaluate(() => localStorage.getItem('terma-demo-v2'));
      for (let i = 0; i < 3; i++) {
        await page.locator('.site-pin').nth(i).click();
        await page.waitForFunction(index => document.querySelectorAll('.landing-site-choice')[index].getAttribute('aria-pressed') === 'true', i);
        assert.equal(await page.locator('.landing-site-choice').nth(i).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#site-area-detail a').getAttribute('href'), paths[i]);
        const pin = await page.locator('.site-pin').nth(i).boundingBox();
        assert.ok(pin.width >= 44 && pin.height >= 44);
      }
      for (let i = 0; i < 3; i++) {
        await page.locator('.landing-site-choice').nth(i).focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(index => document.querySelectorAll('.site-pin')[index].getAttribute('aria-pressed') === 'true', i);
        assert.equal(await page.locator('.site-pin').nth(i).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('.site-pin[aria-pressed="true"]').count(), 1);
        assert.equal(await page.locator('#site-area-detail a').getAttribute('href'), paths[i]);
      }
      assert.equal(await page.evaluate(() => localStorage.getItem('terma-demo-v2')), original);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${width}`);
      await page.locator('.landing-site-choice').first().click();
      if (!process.env.SKIP_CAPTURE && [390, 1024, 1440].includes(width)) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(out, `landing-${width}.png`), fullPage: true, animations: 'disabled' });
        await page.locator('.intro-hero').screenshot({ path: path.join(out, `hero-${width}.png`), animations: 'disabled' });
        await page.locator('#peran').screenshot({ path: path.join(out, `team-${width}.png`), animations: 'disabled' });
      }
    }
    // Failure keeps explanation and equivalent selectors available.
    await page.route('**/_next/image?**', route => route.abort());
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('.landing-site-fallback').waitFor();
    assert.equal(await page.locator('.site-pin:visible').count(), 0);
    await page.locator('.landing-site-choice').last().click();
    assert.equal(await page.locator('#site-area-detail a').getAttribute('href'), '/rencana');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, widths: [320, 390, 768, 1024, 1440], imageLoaded: true, threeHotspots: true, keyboardSelection: true, imageFailureFallback: true, demoDataUnchanged: true, runtimeErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
