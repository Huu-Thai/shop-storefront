# Shop Storefront

A storefront theme for the **shop** headless commerce API, built with Next.js 16 (App Router, Cache
Components, React 19), TypeScript and Tailwind CSS 4. Design system **Ink Store**: base colour
`#191919` (shared with Shop Admin), light-first, six accent presets, light and dark modes, WCAG 2.2
AA contrast checked in tests.

- **Style guide:** `/style-guide` (live) and [`docs/STYLE-GUIDE.md`](docs/STYLE-GUIDE.md)
- **Rebrand:** [`docs/THEMING.md`](docs/THEMING.md) · **Extend:** [`docs/EXTENDING.md`](docs/EXTENDING.md)
- **Install:** [`docs/INSTALL.md`](docs/INSTALL.md) · **Deploy:** [`docs/DEPLOY.md`](docs/DEPLOY.md) ·
  **Fix problems:** [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)
- **Test:** [`docs/TESTING.md`](docs/TESTING.md) · **Release:** [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md)
- **All docs:** [`docs/README.md`](docs/README.md) · **Changes:** [`CHANGELOG.md`](CHANGELOG.md) · **Roadmap:** [`PLAN.md`](PLAN.md)

## Requirements

- Node.js 22 or newer
- A running shop API (`../shop`) with at least one store (`npm run seed:demo` there for demo data)

## Quick start

```bash
npm install
cp .env.example .env.local      # SHOP_API_URL, SESSION_SECRET, DEFAULT_STORE
npm run dev                     # http://localhost:3002
```

## How it works

| Piece            | Where                                | What it does                                                                                                                                                                                   |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store routing    | `src/proxy.ts`, `src/lib/routing.ts` | Picks the store (its `baseUrl`, `/<store-code>`, or `DEFAULT_STORE`), the language (`/en-us` when not the store default) and the currency (cookie), and rewrites to the internal `[ctx]` route |
| Cached data      | `src/server/storefront.ts`           | `'use cache'` reads of config, menus, sliders, banners, categories and products, keyed by store / locale / currency and tagged for invalidation                                                |
| API gateway      | `src/app/api/sf/[...path]`           | Browser code calls the store API through it; cart, order and customer tokens stay in httpOnly cookies and are stripped from responses                                                          |
| Customer session | `src/server/session*.ts`             | Encrypted cookie with the customer's token pair, refreshed by the proxy                                                                                                                        |
| Types            | `src/server/shop-api.d.ts`           | Generated from the shop's OpenAPI document: `npm run api:types`                                                                                                                                |

Catalog URLs (`/men/t-shirts`, `/classic-tee`) come from the shop's URL rewrites: the proxy
answers redirects and 404s, the catch-all route renders categories and products. Filters live in
the URL. Search has its own page and a header overlay with suggestions.

Pages contain nothing personal, so a page cached for one shopper serves everyone in that store;
the cart badge and account features run client-side or on dynamic routes.

CMS pages and blog posts render through the same catch-all; blocks placed on categories, products,
pages and posts appear in their regions. `/sitemap.xml`, `robots.txt` and localized 404 pages are
built in.

### Keeping pages fresh

Pages are cached until the shop says something changed. In Shop Admin → System → Webhooks, add a
webhook:

- **URL:** `https://<your storefront>/api/revalidate`
- **Events:** `product.*`, `category.*`, `inventory.*`, `price-book.entries-changed`, `page.*`,
  `post.*`, `block.*`, `block-placement.*`, `menu.*`, `menu-item.*`, `banner.*`, `slider.*`,
  `slide.*`, `url-rewrites.rebuilt`, `store.updated`
- **Secret:** copy the signing secret into `WEBHOOK_SECRET` and restart.

Edits show on the next request (the old page is served once while the new one renders); deleted
or unpublished content disappears at once. Without the webhook, prices and stock refresh within
minutes and content within hours. `/api/revalidate` answers 404 while `WEBHOOK_SECRET` is unset,
and rejects unsigned or stale (over 5 minutes) calls.

## Configuration

| Variable         | Required |                                                                             |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `SHOP_API_URL`   | yes      | Base URL of the shop API (server-side only)                                 |
| `SESSION_SECRET` | yes      | ≥ 32 characters; encrypts the customer session cookie                       |
| `DEFAULT_STORE`  | yes      | Store code served at the site root                                          |
| `STORES`         | no       | Extra store codes to serve (e.g. another website's stores), comma-separated |
| `SITE_URL`       | no       | Public origin; needed for sitemaps, absolute canonicals and `hreflang`      |
| `WEBHOOK_SECRET` | no       | Signing secret of the shop webhook that refreshes caches (see below)        |
| `MEDIA_ORIGINS`  | no       | Non-https image origins (dev MinIO), **build time**, for the CSP            |
| `DEMO_MODE`      | no       | `true`: orders and account changes refused, demo banner and accent picker   |

## Scripts

| Script                            |                                                           |
| --------------------------------- | --------------------------------------------------------- |
| `npm run dev` / `build` / `start` | Develop (port 3002), build (standalone), serve the build  |
| `npm run check`                   | Typecheck, lint, format check and unit tests              |
| `npm run api:types`               | Regenerate API types from `../shop/openapi/shop-api.json` |
| `npm run test:e2e`                | Browser suite (needs a running storefront and shop API)   |
| `npm run lighthouse`              | Lighthouse scores and budgets on a running build          |
| `npm run notices` / `package`     | Regenerate third-party notices / build the release zip    |

## Licence

Commercial theme licence (added with the release in Phase 5).
