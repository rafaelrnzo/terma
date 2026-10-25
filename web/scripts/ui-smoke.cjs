/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS Node test runner with an optional preinstalled Playwright runtime. */
/* Run against a local dev server. Uses isolated browser contexts, never the user's browser data.
 * PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE may point at a preinstalled test runtime.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const out = path.resolve(__dirname, '../../.impeccable/review/usability');
const key = 'terma-demo-v2';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await context.addInitScript(() => { if (!localStorage.getItem('terma-v1')) localStorage.setItem('terma-v1', 'legacy-untouched'); });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const go = async route => { await page.goto(base + route); await page.locator('main h1').waitFor(); };
    const state = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const user = async name => { await page.getByRole('combobox', { name: 'Pengguna', exact: true }).click(); await page.getByRole('option', { name: new RegExp(name) }).click(); };
    const close = async () => { await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' }); };
    await go('/');
    assert.match(await page.locator('main h1').innerText(), /Panas di lapangan/);
    assert.equal(await page.locator('#tanggal').count(), 0);
    await page.getByRole('link', { name: 'Cara kerja', exact: true }).click();
    await page.getByRole('link', { name: 'Masuk ke pekerjaan hari ini', exact: true }).click();
    await page.waitForURL('**/ringkasan');
    await page.locator('#priority-title').waitFor();
    assert.equal((await state()).pekerja.length, 8);
    assert.equal(await page.evaluate(() => localStorage.getItem('terma-v1')), 'legacy-untouched');
    const seedDate = (await state()).demo.tanggal;
    assert.equal(await page.getByRole('navigation', { name: 'Alur kerja' }).getByRole('link').count(), 5);
    await page.getByRole('link', { name: 'Lanjutkan pekerjaan', exact: true }).click();
    await page.waitForURL('**/paparan');
    await page.getByRole('button', { name: 'Cari halaman atau pekerja' }).click();
    await page.getByLabel('Kata pencarian').fill('demo001');
    await page.getByRole('dialog').getByRole('link').click();
    await page.waitForURL('**/pekerja/DEMO001');
    assert.match(await page.locator('main h1').innerText(), /Andi/);
    await page.keyboard.press('Control+k'); await page.getByRole('dialog').waitFor();
    await page.getByLabel('Kata pencarian').fill('zzzzzz');
    await page.getByRole('button', { name: 'Hapus pencarian' }).click();
    assert.equal(await page.getByLabel('Kata pencarian').inputValue(), ''); await close();
    await go('/impor');
    await page.getByLabel('Cari pekerja', { exact: true }).fill('Andi');
    assert.equal(await page.locator('main a[href^="/pekerja/"]').count(), 1);
    await page.getByLabel('Cari pekerja', { exact: true }).fill('missing-worker');
    await page.getByRole('button', { name: 'Reset pencarian & filter' }).click();
    assert.equal(await page.locator('main a[href^="/pekerja/"]').count(), 8);
    await page.locator('#worker-crew').click(); await page.getByRole('option', { name: 'Regu Bekisting', exact: true }).click();
    assert.equal(await page.locator('main a[href^="/pekerja/"]').count(), 4);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Unduh templat', exact: true }).first().click();
    assert.match((await download).suggestedFilename(), /csv$/);
    await go('/rencana');
    assert.equal(await page.locator('main a[href^="/pekerja/"]').count(), 8);
    await page.getByRole('combobox', { name: 'Filter persetujuan' }).click();
    await page.getByRole('option', { name: 'Belum disetujui', exact: true }).click();
    assert.equal(await page.locator('main a[href^="/pekerja/"]').count(), 3);
    await page.locator('main a[href^="/pekerja/"]').first().click();
    await page.getByRole('button', { name: 'Setujui rencana', exact: true }).waitFor();
    await go('/instruksi');
    await page.getByRole('button', { name: 'Pratinjau WhatsApp', exact: true }).first().click();
    assert.match(await page.getByRole('dialog').innerText(), /Tidak ada WhatsApp/); await close();
    await page.getByRole('button', { name: 'Salin pesan', exact: true }).first().click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /SIMULASI/);
    // Complete a real local state transition: Sari acknowledges BEK, reports, Ratna verifies.
    await user('Sari');
    await page.getByRole('button', { name: 'Akui penerimaan', exact: true }).click();
    await go('/tindakan');
    await page.getByRole('button', { name: 'Catat tindakan', exact: true }).first().click();
    await page.getByRole('button', { name: 'Simpan laporan', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await user('Ratna');
    await page.getByRole('button', { name: 'Verifikasi', exact: true }).first().click();
    await page.getByRole('button', { name: 'Terverifikasi', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await state()).tindakan.filter(t => t.status === 'TERVERIFIKASI').length, 2);
    await go('/panduan');
    await page.getByRole('button', { name: 'Coba peran Budi' }).click();
    await go('/pekerja/DEMO006');
    assert.match(await page.locator('main h1').innerText(), /Profil tidak tersedia/);
    await go('/impor');
    assert.equal(await page.locator('main a[href^="/pekerja/"]').count(), 4);
    await page.getByRole('button', { name: /Coba sebagai Ratna/ }).click();
    await page.locator('#tanggal').fill('2026-11-04');
    await page.getByRole('button', { name: 'Kembali ke tanggal demo' }).click();
    assert.equal((await state()).tanggal, seedDate);
    await page.reload(); await page.locator('main h1').waitFor();
    assert.equal((await state()).tindakan.filter(t => t.status === 'TERVERIFIKASI').length, 2);
    const routes = ['/', '/ringkasan', '/impor', '/paparan', '/pengukuran', '/rencana', '/instruksi', '/tindakan', '/laporan', '/panduan', '/pekerja/DEMO001', '/regu/cor'];
    const internal = new Set();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const route of routes) {
        await go(route); await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route + ':' + width);
        for (const href of await page.locator('a[href^="/"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')))) internal.add(href);
        assert.equal(await page.locator('a[href="#"],a:not([href])').count(), 0);
        for (const button of await page.locator('button:visible').all()) assert.ok((await button.getAttribute('aria-label')) || (await button.innerText()).trim(), route + ': unnamed button');
        if (!process.env.SKIP_CAPTURE) await page.screenshot({ path: path.join(out, (route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')) + '-' + width + '.png'), fullPage: true, animations: 'disabled' });
      }
    }
    let viewportChecks = routes.length * 2;
    for (const href of internal) { const response = await page.request.get(base + href); assert.equal(response.status(), 200, href); }
    await page.setViewportSize({ width: 320, height: 844 }); await go('/ringkasan');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); viewportChecks++;
    await page.getByRole('button', { name: 'Buka navigasi' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Pelaksanaan & verifikasi', exact: true }).click();
    await page.waitForURL('**/tindakan'); await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await go('/unknown-route'); assert.match(await page.locator('main h1').innerText(), /Halaman tidak ditemukan/);
    await page.getByRole('link', { name: 'Kembali ke ringkasan', exact: true }).click();
    await page.waitForURL(base + '/ringkasan');
    // All remaining action families: zone/hour selection, forms, plan edits/approval, print, filters.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('.zone-choice').filter({ hasText: 'Zona Gudang' }).click();
    await page.getByRole('button', { name: '12.00', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '12.00', exact: true }).getAttribute('aria-pressed'), 'true');
    for (const width of [320, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/ringkasan', '/rencana', '/impor', '/pekerja/DEMO001', '/panduan']) {
        await go(route); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route + ':' + width); viewportChecks++;
        if (!process.env.SKIP_CAPTURE && width === 1024 && ['/', '/ringkasan', '/rencana'].includes(route)) await page.screenshot({ path: path.join(out, (route === '/' ? 'home' : route.slice(1)) + '-1024.png'), fullPage: true, animations: 'disabled' });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go('/pengukuran');
    await page.locator('#in-isbb').fill('99'); await page.locator('#in-alat').fill('QA-DEMO');
    await page.getByRole('button', { name: 'Catat bacaan', exact: true }).click();
    await page.locator('#bacaan-error').waitFor();
    assert.equal(await page.locator('#in-isbb').inputValue(), '99');
    await page.locator('#in-isbb').fill('28.5');
    await page.getByRole('button', { name: 'Catat bacaan', exact: true }).click();
    assert.ok((await state()).bacaan.some(b => b.idAlat === 'QA-DEMO'));
    await go('/pekerja/DEMO002');
    await page.getByRole('button', { name: 'Ubah penugasan', exact: true }).click();
    await page.locator('#ub-zona').click(); await page.getByRole('option', { name: /Zona Gudang/ }).click();
    await page.getByRole('button', { name: 'Simpan & hitung ulang', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await state()).penugasan.find(a => a.pekerjaKode === 'DEMO002').zonaKode, 'GUDANG');
    await page.getByRole('button', { name: /Setujui rencana|Setujui ulang/ }).click();
    assert.ok((await state()).rencana.find(r => r.pekerjaKode === 'DEMO002' && !r.digantikan).disetujuiOleh);
    await go('/instruksi');
    const cor = page.locator('[data-slot="card"]').filter({ has: page.getByRole('heading', { name: 'Regu Cor', exact: true }) });
    await cor.getByRole('button', { name: 'Catat sudah dibagikan', exact: true }).click();
    await cor.getByRole('button', { name: 'Tandai gagal tersampaikan', exact: true }).click();
    await page.getByRole('button', { name: 'Simpan status gagal', exact: true }).click();
    await page.locator('#gagal-COR-error').waitFor();
    await page.getByLabel('Alasan pesan tidak sampai').fill('Simulasi penerima tidak tersedia');
    await page.getByRole('button', { name: 'Simpan status gagal', exact: true }).click();
    assert.ok((await state()).pengiriman.some(p => p.status === 'GAGAL'));
    await go('/laporan');
    await page.evaluate(() => { window.print = () => { window.__printCalled = true; }; });
    await page.getByRole('button', { name: 'Cetak laporan', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__printCalled), true);
    await user('Budi');
    assert.equal(await page.getByText('Gita (demo)', { exact: true }).count(), 0);
    await go('/paparan'); assert.equal(await page.getByText('Eko (demo)', { exact: true }).count(), 0);
    await user('Ratna');
    await page.getByRole('button', { name: 'Konfirmasi riwayat paparan', exact: true }).first().click();
    assert.ok((await state()).konfirmasi.some(k => k.pekerjaKode === 'DEMO004'));
    await go('/impor');
    await page.locator('#pekerja-isi').fill('kode_pekerja,nama,regu,tanggal_mulai,tugas,zona,apd\nQA001,Pekerja QA fiktif,COR,' + seedDate + ',PEMERIKSAAN,GUDANG,Standar');
    const importer = page.locator('[data-slot="card"]').filter({ has: page.locator('#pekerja-isi') });
    await importer.getByRole('button', { name: 'Impor', exact: true }).click();
    assert.ok((await state()).pekerja.some(p => p.kode === 'QA001'));
    await importer.getByRole('button', { name: 'Kosongkan isian' }).click();
    assert.equal(await page.locator('#pekerja-isi').inputValue(), '');
    // Damaged storage is preserved, and temporary demo provides recovery guidance.
    const broken = await browser.newContext();
    await broken.addInitScript(k => localStorage.setItem(k, '{broken'), key);
    const bp = await broken.newPage(); await bp.goto(base + '/ringkasan');
    await bp.getByRole('button', { name: 'Coba simpan lagi' }).waitFor();
    assert.equal(await bp.evaluate(k => localStorage.getItem(k), key), '{broken');
    await bp.getByRole('button', { name: 'Coba simpan lagi' }).click();
    assert.match(await bp.locator('main [role="alert"]').innerText(), /tidak ditimpa/);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, routes: routes.length, internalLinks: internal.size, viewportChecks, runtimeErrors: errors, tests: ['automatic demo', 'legacy preservation', 'search and keyboard', 'intro entry and task queue', 'plan list filters and detail', 'directory filters', 'CSV download/import/clear', 'local message preview', 'clipboard', 'acknowledgement-report-verification', 'role scopes including reports', 'date recovery', 'persistence', 'mobile navigation', '404 recovery', 'corrupt storage', 'zone/hour selection', 'manual measurement validation/save', 'assignment change/approval', 'delivery failure validation/save', 'adaptation confirmation', 'print invocation'] }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
