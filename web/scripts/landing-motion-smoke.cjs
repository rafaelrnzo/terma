/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS browser smoke runner. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const out = path.resolve(__dirname, '../../.impeccable/review/landing-motion');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    await page.locator('.handoff-demo').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Jeda animasi' }).waitFor();
    const original = await page.evaluate(() => localStorage.getItem('terma-demo-v2'));
    await page.waitForFunction(() => document.querySelectorAll('.handoff-step')[2].getAttribute('aria-pressed') === 'true');
    await page.getByRole('button', { name: 'Ulangi alur' }).waitFor();
    assert.equal(await page.locator('.handoff-demo').getAttribute('data-playing'), 'false');
    await page.getByRole('button', { name: 'Ulangi alur' }).click();
    await page.getByRole('button', { name: 'Jeda animasi' }).click();
    const paused = await page.locator('.handoff-step[aria-pressed="true"]').innerText();
    await page.waitForTimeout(1600);
    assert.equal(await page.locator('.handoff-step[aria-pressed="true"]').innerText(), paused);
    for (let index = 0; index < 3; index++) {
      await page.locator('.handoff-step').nth(index).click();
      assert.equal(await page.locator('.handoff-step[aria-pressed="true"]').count(), 1);
      assert.equal(await page.locator('.handoff-step').nth(index).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.handoff-demo').getAttribute('data-playing'), 'false');
    }
    assert.match(await page.locator('#handoff-output').innerText(), /Laporan diperiksa/);
    await page.getByRole('button', { name: 'Ulangi alur' }).click();
    await page.locator('#pertanyaan').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.handoff-demo').dataset.playing === 'false');
    assert.equal(await page.evaluate(() => localStorage.getItem('terma-demo-v2')), original);
    await page.waitForFunction(() => document.querySelector('.landing-nav a[href="#pertanyaan"]').getAttribute('aria-current') === 'location');
    assert.notEqual(await page.locator('.landing-reading-progress').evaluate(el => getComputedStyle(el).transform), 'matrix(0, 0, 0, 1, 0, 0)');
    // Changing the preference while playback is active cancels it.
    await page.locator('.handoff-demo').scrollIntoViewIfNeeded();
    await page.locator('.handoff-controls button').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.handoff-demo').dataset.playing === 'false');
    assert.equal(await page.locator('.handoff-controls button').count(), 0);
    await page.locator('.handoff-step').nth(1).focus();
    await page.keyboard.press('Enter');
    assert.match(await page.locator('#handoff-output').innerText(), /Pelaksanaan dicatat/);
    assert.equal(await page.locator('.handoff-receipt-content').evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.locator('.landing-plan-example').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.landing-plan-example').evaluate(el => el.getAnimations().length), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('.handoff-controls button').waitFor();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Overflow: ' + width);
      await page.locator('.handoff-step').nth(0).click();
      if (!process.env.SKIP_CAPTURE && [390, 1024, 1440].includes(width)) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(out, 'landing-' + width + '.png'), fullPage: true, animations: 'disabled' });
        for (let index = 0; index < 3; index++) {
          await page.locator('.handoff-step').nth(index).click();
          await page.locator('.intro-handoff').screenshot({ path: path.join(out, 'handoff-' + width + '-step-' + index + '.png'), animations: 'disabled' });
        }
      }
    }
    const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(base);
    await reducedPage.getByRole('heading', { name: 'Rencana kerja-istirahat', exact: true }).waitFor();
    await reducedPage.waitForTimeout(1600);
    assert.equal(await reducedPage.locator('.handoff-demo').getAttribute('data-playing'), 'false');
    assert.equal(await reducedPage.locator('.handoff-controls button').count(), 0);
    assert.equal(await reducedPage.locator('.handoff-step').first().getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, widths: [320, 390, 768, 1024, 1440], autoplayOnce: true, pauseReplay: true, manualKeyboardSelection: true, offscreenStop: true, reducedMotion: true, preferenceChange: true, demoDataUnchanged: true, runtimeErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
