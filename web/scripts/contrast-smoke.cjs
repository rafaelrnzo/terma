/* eslint-disable @typescript-eslint/no-require-imports -- Isolated browser QA runner. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../../.impeccable/review/contrast');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';

async function contrast(page, scope = 'body') {
  return page.evaluate(scope => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) => i === 3 ? v / 255 : v); };
    const over = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
    const luminance = color => color.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const ratio = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const cache = new Map();
    function backgrounds(el) {
      if (!el) return [[255, 255, 255, 1]];
      if (cache.has(el)) return cache.get(el);
      const style = getComputedStyle(el);
      const parents = backgrounds(el.parentElement);
      let colors = parents.map(b => over(rgba(style.backgroundColor), b));
      if (style.backgroundImage.includes('gradient')) {
        const stops = [...style.backgroundImage.matchAll(/rgba?\([^)]*\)/g)].map(m => rgba(m[0]));
        const samples = stops.flatMap((a, i) => i ? Array.from({ length: 11 }, (_, j) => a.map((v, k) => stops[i - 1][k] + (v - stops[i - 1][k]) * j / 10)) : [a]);
        colors = samples.flatMap(a => colors.map(b => over(a, b)));
      }
      cache.set(el, colors); return colors;
    }
    const findings = []; let checked = 0; let minimum = 100;
    const walker = document.createTreeWalker(document.querySelector(scope), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, el = node.parentElement;
      if (!node.textContent.trim() || !el || el.closest('svg,script,style,[aria-hidden="true"],:disabled,[aria-disabled="true"],nextjs-portal')) continue;
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const range = document.createRange(); range.selectNodeContents(node); const box = range.getBoundingClientRect();
      if (box.width < 2 || box.height < 2 || el.closest('.sr-only')) continue;
      const style = getComputedStyle(el), color = rgba(style.color);
      const result = Math.min(...backgrounds(el).map(b => ratio(over(color, b), b)));
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
      const required = large ? 3 : 4.5;
      checked++; minimum = Math.min(minimum, result);
      if (result < required) findings.push({ text: node.textContent.trim().slice(0, 70), ratio: +result.toFixed(2), required, color: style.color, className: el.className });
    }
    const root = getComputedStyle(document.documentElement);
    const pairs = [
      ['--input', '--card'], ['--input', '--background'], ['--input', '--secondary'],
      ['--ring', '--background'], ['--ring', '--card'],
      ['--ring', '--zone-blue'], ['--ring', '--zone-lime'], ['--ring', '--zone-sage'],
      ['--sidebar-active', '--sidebar-background'], ['--sidebar-active', '--sidebar-hover'],
    ];
    const indicators = pairs.map(([a, b]) => ({ pair: a + '/' + b, ratio: +ratio(rgba(root.getPropertyValue(a)), rgba(root.getPropertyValue(b))).toFixed(2) }));
    for (const pair of indicators) if (pair.ratio < 3) findings.push({ ...pair, required: 3 });
    return { checked, minimum: +minimum.toFixed(2), indicatorMinimum: Math.min(...indicators.map(p => p.ratio)), findings };
  }, scope);
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const results = []; const errors = []; page.on('pageerror', e => errors.push(e.message));
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/ringkasan', '/rencana', '/pengukuran', '/']) {
        await page.goto(base + route); await page.locator('main h1').waitFor(); await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const result = await contrast(page); results.push({ route, width, ...result });
        if (route === '/ringkasan' || (width === 1440 && route === '/')) await page.screenshot({ path: path.join(out, `${route === '/' ? 'landing' : route.slice(1)}-${width}.png`), fullPage: true, animations: 'disabled' });
      }
    }
    await page.goto(base + '/ringkasan'); await page.locator('.scheme-zone').first().waitFor();
    await page.locator('.app-sidebar a[href="/impor"]').hover();
    results.push({ state: 'sidebar-hover', ...await contrast(page) });
    await page.locator('.today-priority a').hover();
    results.push({ state: 'primary-hover', ...await contrast(page) });
    await page.getByRole('button', { name: 'Panduan dashboard' }).click(); await page.locator('.driver-popover').waitFor();
    // Scope the tour separately; the dimmed background is not an active reading surface.
    results.push({ state: 'tour', ...await contrast(page, '.driver-popover') });
    await page.keyboard.press('Escape');
    const cdp = await page.context().newCDPSession(page);
    for (const type of ['deuteranopia', 'protanopia', 'tritanopia']) {
      await cdp.send('Emulation.setEmulatedVisionDeficiency', { type });
      await page.screenshot({ path: path.join(out, `${type}.png`), animations: 'disabled' });
    }
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
    console.log(JSON.stringify({ results, errors }, null, 2));
    assert.deepEqual(results.flatMap(r => r.findings), [], 'Rendered text contrast failures');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
