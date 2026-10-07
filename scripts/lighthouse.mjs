// Lighthouse (mobile preset) on the key pages of a running production build. Fails below the
// targets (performance ≥ 90; accessibility, best practices and SEO ≥ 95) or over the budgets in
// lighthouse-budget.json (sizes and third-party requests), or layout shift above 0.1. Each page runs LH_RUNS times (3) and the median-performance run counts,
// as Lighthouse recommends for its run-to-run variance.
// LCP: Lighthouse's simulated LCP over-estimates this theme (see docs/TESTING.md); `npm run lcp`
// measures it with real network and CPU throttling instead.
// Usage: E2E_BASE_URL=http://localhost:3002 node scripts/lighthouse.mjs
// Paths (comma-separated, default below): LH_PATHS=/,/men,/blog
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js';

const base = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
const MIN = { performance: Number(process.env.LH_MIN_PERF ?? 0.9), other: 0.95 };
const MAX_CLS = 0.1;
const RUNS = Math.max(1, Number(process.env.LH_RUNS ?? 3));
const PAGES = (
  process.env.LH_PATHS ??
  '/,/men,/men/t-shirts,/classic-tee,/search?q=tee,/blog,/about,/cart,/account/sign-in'
)
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);
// Pages that are `noindex` on purpose (search, cart, account): Lighthouse's "page is blocked from
// indexing" would cap their SEO score, so for them every *other* SEO audit must pass instead.
const NOINDEX = [/^\/search/, /^\/cart/, /^\/account/, /^\/checkout/];
const budgets = JSON.parse(readFileSync('lighthouse-budget.json', 'utf8'));
const TYPES = { script: 'Script', stylesheet: 'Stylesheet', font: 'Font', image: 'Image' };

/**
 * Checks the page's requests against lighthouse-budget.json. (Lighthouse 12+ no longer evaluates
 * budget files itself, so this reads the network log.) Sizes are KB transferred; the third-party
 * count is requests to origins other than the audited one.
 */
function overBudget(requests) {
  const budget = budgets[0] ?? {};
  const out = [];
  for (const { resourceType, budget: kb } of budget.resourceSizes ?? []) {
    const bytes = requests
      .filter((r) => resourceType === 'total' || r.resourceType === TYPES[resourceType])
      .reduce((sum, r) => sum + (r.transferSize ?? 0), 0);
    if (bytes / 1024 > kb) out.push(`${resourceType} ${Math.round(bytes / 1024)} KB > ${kb} KB`);
  }
  for (const { resourceType, budget: max } of budget.resourceCounts ?? []) {
    if (resourceType !== 'third-party') continue;
    const n = requests.filter((r) => new URL(r.url).origin !== new URL(base).origin).length;
    if (n > max) out.push(`third-party requests ${n} > ${max}`);
  }
  return out;
}

// A fresh browser per run: a Chrome that has already audited pages carries caches and memory
// pressure into the next run and lowers its score.
const audit = async (url) => {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox'],
  });
  try {
    return await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
  } finally {
    await chrome.kill();
  }
};
mkdirSync('lighthouse-report', { recursive: true });
const failures = [];
// Warm each page once so a freshly started server's first render doesn't count against it.
for (const p of PAGES) await fetch(`${base}${p}`).catch(() => {});
{
  for (const p of PAGES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await audit(`${base}${p}`));
    runs.sort((a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score);
    const result = runs[Math.floor(runs.length / 2)];
    const { categories, audits } = result.lhr;
    const scores = Object.fromEntries(Object.entries(categories).map(([k, c]) => [k, c.score]));
    const over = overBudget(audits['network-requests'].details.items);
    const name = p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
    writeFileSync(`lighthouse-report/${name}.html`, ReportGenerator.generateReportHtml(result.lhr));
    writeFileSync(`lighthouse-report/${name}.json`, JSON.stringify(result.lhr, null, 2));
    const line = Object.entries(scores)
      .map(([k, v]) => `${k.replace('best-practices', 'best').slice(0, 5)} ${Math.round(v * 100)}`)
      .join(' · ');
    const lcp = audits['largest-contentful-paint'].displayValue;
    const cls = audits['cumulative-layout-shift'].displayValue;
    console.log(
      `${p.padEnd(22)} ${line}${NOINDEX.some((re) => re.test(p)) ? ' (noindex by design)' : ''} · LCP ${lcp} · CLS ${cls}${over.length ? ` · over budget: ${over.join(', ')}` : ''}`,
    );
    const noindex = NOINDEX.some((re) => re.test(p));
    for (const [k, v] of Object.entries(scores)) {
      const min = k === 'performance' ? MIN.performance : MIN.other;
      if (k === 'seo' && noindex) {
        const failed = categories.seo.auditRefs
          .map((r) => audits[r.id])
          .filter((a) => a.id !== 'is-crawlable' && a.score !== null && a.score < 1);
        for (const a of failed) failures.push(`${p}: SEO audit failed (${a.id})`);
        continue;
      }
      if (v < min) failures.push(`${p}: ${k} ${Math.round(v * 100)} < ${min * 100}`);
    }
    for (const b of over) failures.push(`${p}: over budget (${b})`);
    // Layout shift is measured directly.
    const shift = audits['cumulative-layout-shift'].numericValue;
    if (shift > MAX_CLS) failures.push(`${p}: layout shift ${shift.toFixed(3)} > ${MAX_CLS}`);
  }
}
if (failures.length) {
  console.error(`\nLighthouse targets missed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nLighthouse: every page meets the targets. Reports in lighthouse-report/.');
