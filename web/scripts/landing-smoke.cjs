/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS browser smoke runner. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const out = path.resolve(__dirname, '../../.impeccable/review/landing-information');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.landing-roles article').count(), 3);
      assert.equal(await page.locator('.landing-step').count(), 7);
      assert.equal(await page.locator('#tanggal').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Overflow at ' + width);
      for (const anchor of await page.getByRole('navigation', { name: 'Pengantar' }).getByRole('link').all()) {
        const href = await anchor.getAttribute('href');
        await anchor.click();
        assert.equal(await page.locator(href).count(), 1);
        assert.ok((await page.locator(href).boundingBox()).y >= -1, href);
      }
      for (const trigger of await page.locator('#pertanyaan button').all()) {
        await trigger.click();
        assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
        const answer = page.locator('#' + await trigger.getAttribute('aria-controls'));
        assert.ok((await answer.innerText()).length > 50);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await trigger.click();
      }
      await page.evaluate(() => scrollTo(0, 0));
      if (!process.env.SKIP_CAPTURE && [390, 1024, 1440].includes(width)) {
        await page.screenshot({ path: path.join(out, 'landing-' + width + '.png'), fullPage: true, animations: 'disabled' });
        for (const [name, selector] of [['hero', '.intro-hero'], ['roles', '#peran'], ['workflow', '#cara-kerja'], ['example', '.landing-example'], ['limits', 'section[aria-labelledby="demo-title"]']]) {
          await page.locator(selector).screenshot({ path: path.join(out, name + '-' + width + '.png'), animations: 'disabled' });
        }
        await page.locator('#pertanyaan button').first().click();
        await page.locator('#pertanyaan').screenshot({ path: path.join(out, 'faq-open-' + width + '.png'), animations: 'disabled' });
      }
    }
    const destinations = await page.locator('a[href^="/"]').evaluateAll(nodes => [...new Set(nodes.map(n => n.getAttribute('href')))]);
    for (const href of destinations) assert.equal((await page.request.get(base + href)).status(), 200, href);
    await page.goto(base);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true);
    await page.getByRole('link', { name: 'Coba ruang kerja demo', exact: true }).click();
    await page.waitForURL('**/ringkasan');
    await page.getByRole('heading', { name: 'Pekerjaan hari ini', exact: true }).waitFor();
    // The explanation remains readable without JavaScript or a storage-backed session.
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage();
    await staticPage.goto(base);
    assert.equal(await staticPage.locator('.landing-step').count(), 7);
    assert.match(await staticPage.locator('main').innerText(), /Yang belum tersedia/);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, widths: [320, 390, 768, 1024, 1440], roles: 3, stages: 7, faqQuestions: 5, internalDestinations: destinations.length, runtimeErrors: errors, keyboardSkip: true, staticContentWithoutJS: true }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
