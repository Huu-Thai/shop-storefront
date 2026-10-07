# Changelog

All notable changes to Shop Storefront. Versions follow [Semantic Versioning](https://semver.org/);
the shop API it talks to is versioned separately (`/api/v1`).

## 1.0.0-rc.1 — 2026-10-07

First release candidate.

### Added

- **Foundation:** Next.js 16 App Router with Cache Components, React 19, TypeScript strict,
  Tailwind CSS 4; the Ink Store design system (base `#191919`, shared with Shop Admin) with light
  and dark modes and six WCAG 2.2 AA accent presets (lime, cobalt, coral, teal, amber, violet);
  live style guide at `/style-guide`; English and Vietnamese.
- **Stores:** several stores, languages and currencies from one deployment, picked by host, path
  or `/<store-code>`; the shop's URL rewrites drive clean URLs, with real 301 / 302 / 308 / 404
  statuses.
- **Catalog:** category pages with filters, sorting and paging; product pages with options,
  bundles, stock, tiers and related products; search with suggestions.
- **Cart and checkout:** mini-cart drawer, cart page, coupons, loyalty points, one-page checkout
  for guests and customers, redirect payments, order pages with pay-now and cancel.
- **Customer accounts:** register, sign in and out, password, profile, addresses, orders, loyalty
  points; the guest cart merges on sign-in.
- **Content:** CMS pages, blog with tags, block placements on categories, products, pages and
  posts, menus, sliders and banners; localized 404 pages.
- **SEO:** sitemap index per store and language, `robots.txt`, canonical links, `hreflang`,
  Open Graph, product, post and breadcrumb structured data.
- **Freshness:** `/api/revalidate` receives the shop's signed webhooks and refreshes only the
  affected pages; deleted and unpublished content disappears at once.
- **Security:** an API gateway so the browser never sees API or customer tokens (httpOnly
  cookies, same-origin checks, header allow-lists), an encrypted session cookie with refresh,
  and a Content Security Policy.
- **Release:** demo mode (`DEMO_MODE`) with a banner and accent picker, Docker image, standalone
  server start, Playwright suite with accessibility checks at three viewports, Lighthouse
  budgets, buyer documentation, release checklist, `npm run package` for the distributable
  archive; the server stops at start when its configuration is invalid.

### Requires

- Node.js 22+ and the shop API (v1) with the storefront webhook events (`page.*`, `post.*`,
  `block.*`, `menu.*`, `banner.*`, `slider.*`, `category.*`, `price-book.entries-changed`,
  `url-rewrites.rebuilt`, `store.updated`) for instant page refresh.

### Known limits

- The shop sends no e-mails and has no forgotten-password flow yet, so the theme neither promises
  e-mail confirmations nor offers a reset link.
- Gift cards can't be bought online yet.
- The theme shows neutral placeholders for products without images. The shop's demo images are
  generated illustrations, not photographs.
