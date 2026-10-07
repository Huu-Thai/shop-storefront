// Largest Contentful Paint with *applied* throttling (slow 4G: 1.6 Mbps, 150 ms; 4× slower CPU) on
// a phone-sized window, median of LCP_RUNS (5) fresh browser contexts per page. Fails above 2.5 s.
// Lighthouse's own LCP is simulated from a trace and over-estimates pages whose scripts are
// async, so this is the number to judge Core Web Vitals by in the lab.
// Usage: E2E_BASE_URL=http://localhost:3002 node scripts/lcp.mjs
import { chromium } from '@playwright/test';

const base = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
const RUNS = Math.max(1, Number(process.env.LCP_RUNS ?? 5));
const LIMIT = Number(process.env.LCP_LIMIT ?? 2500);
const PAGES = (process.env.LH_PATHS ?? '/,/men,/classic-tee,/search?q=tee,/blog,/about,/cart')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

const browser = await chromium.launch();
const failures = [];
try {
  for (const path of PAGES) {
    await fetch(`${base}${path}`).catch(() => {}); // warm the server's cache
    const samples = [];
    for (let i = 0; i < RUNS; i++) {
      const ctx = await browser.newContext({
        viewport: { width: 412, height: 823 },
        isMobile: true,
        hasTouch: true,
      });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.addInitScript(() => {
        window.__lcp = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) window.__lcp = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
      await page.goto(`${base}${path}`, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      samples.push(Math.round(await page.evaluate(() => window.__lcp)));
      await ctx.close();
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];
    console.log(`${path.padEnd(18)} LCP ${median} ms (runs: ${samples.join(' ')})`);
    if (median > LIMIT) failures.push(`${path}: LCP ${median} ms > ${LIMIT} ms`);
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(`\nLCP over the limit:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`\nLCP: every page is within ${LIMIT} ms.`);
