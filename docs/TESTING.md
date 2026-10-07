# Testing

| Suite      | Command              | Needs                       | Covers                                                         |
| ---------- | -------------------- | --------------------------- | -------------------------------------------------------------- |
| Unit       | `npm test`           | nothing                     | Routing, gateway, session, cache invalidation, SEO, tokens     |
| Everything | `npm run check`      | nothing                     | Types, lint, format and the unit tests                         |
| Browser    | `npm run test:e2e`   | A running storefront + shop | Shopping flows, account, accessibility, layout at 3 widths     |
| Lighthouse | `npm run lighthouse` | A production build running  | Performance, accessibility, best practices, SEO and budgets    |
| LCP        | `npm run lcp`        | A production build running  | Largest Contentful Paint under real network and CPU throttling |

## Unit tests (Vitest)

`npm test` runs every `*.test.ts(x)` next to the code. Worth knowing:

- `src/theme/tokens.test.ts` checks the contrast of every colour pair in light and dark mode for
  **every accent preset**. Change a colour and the test tells you if it stops being readable.
- `src/i18n/i18n.test.ts` fails when a language is missing a key or changes a placeholder.
- `src/server/gateway.test.ts` covers what the API gateway refuses: unknown stores, path tricks,
  token endpoints, cross-site changes, and (in demo mode) order and account changes.

## Browser suite (Playwright)

### Prepare

1. Build and start the theme as in production, pointing at a shop API with demo data (categories
   `men`, a product `classic-tee`, a blog post, a CMS page `about`, and the `vn-vi` store):

   ```bash
   npm run build
   HOSTNAME=0.0.0.0 PORT=3002 STORES=vn-vi SITE_URL=http://localhost:3002 npm start   # plus SHOP_API_URL, SESSION_SECRET, DEFAULT_STORE
   ```

2. Install the browser once: `npx playwright install chromium`.
3. Optionally set `E2E_BASE_URL` (default `http://localhost:3002`).

The paths and labels the specs look for are in `e2e/routes.ts` and the specs themselves; adapt
them to your own catalog.

### Run

```bash
npm run test:e2e                          # read-only flows
E2E_ORDERS=1 npm run test:e2e             # also places a test order (cash on delivery)
E2E_DEMO=1 E2E_BASE_URL=… npm run test:e2e   # against a DEMO_MODE=true storefront
npx playwright test --project=phone-360   # one viewport
npx playwright show-report                # after a failure
```

| Project        | Width | Specs                               |
| -------------- | ----- | ----------------------------------- |
| `desktop-1440` | 1440  | screens, shopping, checkout         |
| `tablet-768`   | 768   | screens                             |
| `phone-360`    | 360   | screens, shopping                   |
| `customer`     | 1280  | account (signs up a customer first) |
| `demo`         | 1280  | demo mode (needs `E2E_DEMO=1`)      |

### What it checks

- **Screens** (light and dark): every key page returns the right status, has exactly one visible
  `h1`, doesn't scroll sideways, and has **no WCAG 2.2 AA violations** (axe).
- **Shopping:** browse to a product, sorting and filters in the URL (and `noindex` on them),
  search suggestions, the Vietnamese store in dong, cart add / change / remove, the skip link,
  keyboard use of the search overlay (arrows, Esc, focus returns) and of the cart drawer (focus
  stays inside, Esc, focus returns to the button),
  localized 404s, sitemap, robots, hreflang, structured data, security headers.
- **Checkout** (`E2E_ORDERS=1`): a guest buys a product with cash on delivery and the order page
  opens.
- **Account:** sign-up, the overview, orders, points, profile, an address added and removed,
  sign-out.
- **Demo:** the banner, the accent picker (and its contrast for every preset), refused
  registration and orders — in the checkout (a readable notice) and in Vietnamese.

### Data the suite leaves behind

- The `customer` project registers a customer such as `e2e-<time>@example.test` unless you give an
  existing one with `E2E_EMAIL` and `E2E_PASSWORD`. Its session is saved in `e2e/.auth/`, which is
  git-ignored and never packaged.
- `E2E_ORDERS=1` places one order per run.

Run the suite against a staging shop, or delete those customers and orders afterwards.

### Tips for writing specs

- Next keeps earlier pages mounted but hidden. Filter locators with `.filter({ visible: true })`
  (exported as `visible` from `e2e/routes.ts`).
- Wait for `networkidle` (`hydrated(page)`) before clicking: buttons respond only after hydration.
- Signing out revokes the session in the shop, so a spec that signs out must sign in on its own.

## Lighthouse

```bash
npm run build && HOSTNAME=0.0.0.0 PORT=3002 npm start     # in another terminal, with the variables set
npm run lighthouse
```

It audits the home page, a category, a product, search, the blog, a CMS page, the cart and sign-in
on a mobile profile. Each page runs three times and the median counts. It fails below:

| Category       | Minimum |
| -------------- | ------- |
| Performance    | 90      |
| Accessibility  | 95      |
| Best practices | 95      |
| SEO            | 95      |

and when a page goes over `lighthouse-budget.json` (read by the script itself, since Lighthouse 12 no longer evaluates budget files; scripts 400 KB, styles 60 KB, fonts 150 KB, no
third-party requests) or shifts its layout by more than 0.1 (CLS). Set `LH_PATHS=/,/men` to audit
other pages. Reports are written to `lighthouse-report/`.

Pages that are `noindex` on purpose (search, cart, account, checkout) can't reach a full SEO score:
Lighthouse subtracts for "blocked from indexing". For those, every _other_ SEO audit must pass.

Scores vary with the machine. Run it on an idle computer, and judge a change by the median of
several runs. The script starts a fresh browser for every run; reusing one browser lowered
performance scores by about five points.

### Largest Contentful Paint

Lighthouse **simulates** LCP from a trace. For this theme (async scripts, server-rendered text) it
reports about 2.8–3.0 s while a real throttled load paints in under one second, so the gate for LCP
is `npm run lcp`: it loads each page in a phone-sized window on slow 4G (1.6 Mbps, 150 ms) with a 4×
slower CPU, five times, and fails when the median is above 2.5 s. Typical results are 0.7–0.9 s;
the cart page, which paints after hydration, is about 2 s.
