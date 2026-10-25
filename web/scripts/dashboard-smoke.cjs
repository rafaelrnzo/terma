/* eslint-disable @typescript-eslint/no-require-imports -- Isolated browser smoke runner. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const out = path.resolve(__dirname, '../../.impeccable/review/dashboard');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = []; const mapRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/api\.mapbox\.com|events\.mapbox\.com/.test(request.url())) mapRequests.push(request.url()); });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + '/ringkasan');
      await page.locator('.scheme-zone').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const baseline = await page.evaluate(() => localStorage.getItem('terma-demo-v2'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'overflow: ' + width);
      assert.equal(await page.locator('.app-sidebar').isVisible(), width >= 1024);
      assert.equal(await page.locator('.scheme-zone').count(), 3);
      for (const button of await page.locator('.scheme-zone').all()) {
        await button.click();
        assert.equal(await button.getAttribute('aria-pressed'), 'true');
        const name = (await button.getAttribute('aria-label')).replace('Pilih ', '');
        assert.match(await page.locator('.zone-readout').innerText(), new RegExp(name.replace(/[()]/g, '\\$&')));
      }
      await page.getByRole('button', { name: '12.00', exact: true }).click();
      assert.match(await page.locator('.zone-readout').innerText(), /12.00/);
      await page.locator('.zone-choice').first().click();
      assert.equal(await page.locator('.scheme-zone').first().getAttribute('aria-pressed'), 'true');
      await page.locator('.scheme-zone').last().focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('.scheme-zone').last().getAttribute('aria-pressed'), 'true');
      await page.getByText('Tentang peta', { exact: true }).click();
      assert.match(await page.locator('.map-caption').innerText(), /belum dikonfigurasi/);
      await page.getByText('Tentang peta', { exact: true }).click();
      await page.getByRole('button', { name: 'Panduan dashboard', exact: true }).click();
      await page.locator('.driver-popover').waitFor();
      assert.equal(await page.locator('body.driver-simple').count(), 1, 'reduced motion');
      for (let step = 1; step <= 6; step++) {
        assert.equal(await page.locator('.driver-popover-progress-text').innerText(), `${step} dari 6`);
        const box = await page.locator('.driver-popover').boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1 && box.y >= 0 && box.y + box.height <= 1001, `tour clipped at ${width}, step ${step}: ${JSON.stringify(box)}`);
        if (step === 4 && [390, 1440].includes(width)) await page.screenshot({ path: path.join(out, `tour-${width}.png`) });
        await page.getByRole('button', { name: step === 6 ? 'Selesai' : 'Lanjut', exact: true }).click();
      }
      await page.locator('.driver-popover').waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('button', { name: 'Panduan dashboard', exact: true }).evaluate(el => el === document.activeElement), true);
      await page.getByRole('button', { name: 'Panduan dashboard', exact: true }).click();
      await page.locator('.driver-popover').waitFor();
      await page.keyboard.press('Escape');
      await page.locator('.driver-popover').waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => localStorage.getItem('terma-demo-v2')), baseline, 'map/tour must not mutate records');
      if (width < 1024) {
        await page.getByRole('button', { name: 'Buka navigasi' }).click();
        await page.getByRole('dialog').getByRole('link', { name: 'Pelaksanaan & verifikasi', exact: true }).click();
        await page.waitForURL('**/tindakan');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.goto(base + '/ringkasan'); await page.locator('.scheme-zone').first().waitFor();
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(out, `dashboard-${width}.png`), fullPage: true, animations: 'disabled' });
      await page.screenshot({ path: path.join(out, `viewport-${width}.png`), animations: 'disabled' });
    }
    // Date/role changes keep the map data honest, including missing readings.
    await page.locator('#tanggal').fill('2026-11-04');
    await page.getByRole('button', { name: /Pilih Zona Cor B/ }).click();
    assert.match(await page.locator('.zone-readout').innerText(), /—/);
    await page.getByRole('button', { name: /Profil panas & riwayat/ }).click();
    assert.match(await page.locator('main').innerText(), /Belum ada bacaan WBGT/);
    await page.getByRole('button', { name: 'Kembali ke tanggal demo' }).click();
    for (const name of ['Budi', 'Sari', 'Tono', 'Ratna']) {
      await page.getByRole('combobox', { name: 'Pengguna', exact: true }).click();
      await page.getByRole('option', { name: new RegExp(name) }).click();
      assert.equal(await page.locator('.scheme-zone').count(), 3);
      assert.ok(await page.getByRole('link', { name: 'Lanjutkan pekerjaan', exact: true }).getAttribute('href'));
    }
    // Sidebar destinations and active grouping; skip link remains functional.
    for (const href of ['/impor', '/paparan', '/pengukuran', '/rencana', '/instruksi', '/tindakan', '/laporan', '/panduan']) {
      await page.goto(base + href); await page.locator('main h1').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, href);
      assert.equal(await page.locator(`.app-sidebar a[href="${href}"][aria-current="page"]`).count() > 0, true, href);
    }
    await page.goto(base + '/ringkasan'); await page.locator('.scheme-zone').first().waitFor();
    // Tour previous/skip controls and focus containment with motion enabled.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Panduan dashboard', exact: true }).click();
    await page.locator('.driver-popover').waitFor();
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await page.getByRole('button', { name: 'Kembali', exact: true }).click();
    assert.equal(await page.locator('.driver-popover-progress-text').innerText(), '1 dari 6');
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement.closest('.driver-popover')), true, 'tour focus escaped');
    }
    await page.getByRole('button', { name: 'Lewati panduan', exact: true }).click();
    await page.locator('.driver-popover').waitFor({ state: 'hidden' });
    await page.goto(base + '/ringkasan'); await page.locator('.scheme-zone').first().waitFor();
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true);
    await page.goto(base); await page.locator('main h1').waitFor();
    assert.equal(await page.locator('.app-sidebar').count(), 0, 'landing stays separate');
    assert.deepEqual(errors, []);
    assert.deepEqual(mapRequests, [], 'no Mapbox network usage without token');
    console.log(JSON.stringify({ passed: true, widths: [320, 390, 768, 1024, 1440], tourSteps: 6, roles: 4, recordMutation: false, mapRequestsWithoutToken: 0, runtimeErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
