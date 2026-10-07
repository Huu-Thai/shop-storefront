# Shop Storefront — plan

A customer-facing storefront theme for the **shop** headless commerce API, sold as a theme that
buyers brand and other developers extend. Sister product of Shop Admin: same base colour, same
token system, same engineering standards.

## 1. Goals

- **Sellable:** professional design system and style guide, documented theming and extension
  points, demo mode, licence, changelog, release checklist (as Shop Admin).
- **Fast:** Core Web Vitals in the green on mid-range phones (LCP ≤ 2.5 s, INP ≤ 200 ms,
  CLS ≤ 0.1); Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility / best practices / SEO.
- **Found:** server-rendered HTML, clean URLs from the shop's URL rewrites, metadata, JSON-LD,
  sitemaps, hreflang, canonical URLs.
- **Accessible:** WCAG 2.2 AA, keyboard and screen-reader friendly, checked by tests.
- **Secure:** the browser only talks to the storefront; customer tokens live in an encrypted
  httpOnly cookie and never reach page scripts.
- **Multi-store:** every store of a website (country / language / currency) from one deployment.

## 2. Architecture

| Piece                                                              | What it does                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4 | Same stack as Shop Admin                                                                                                                                                                                                                                                |
| **Cache Components** (`'use cache'`, `cacheLife`, `cacheTag`)      | Catalog and content are cached per store / locale / currency and invalidated by tag (Phase 4: shop webhooks → `/api/revalidate`)                                                                                                                                        |
| **Store routing** (`src/proxy.ts`)                                 | Resolves the store from the request: a store's `baseUrl` (host + path), else a `/<store-code>` prefix, else `DEFAULT_STORE`; a locale segment when not the store's default; currency from a cookie. Rewrites to the internal `[ctx]` segment so every page is cacheable |
| Server API client (`src/server/api.ts`)                            | Typed `openapi-fetch` client for `/api/v1/store/*` with `x-store`, `accept-language`, `x-currency`, cart token and customer token                                                                                                                                       |
| **API gateway** `/api/sf/*`                                        | Client code calls the store API through it: attaches the cart token and customer session from httpOnly cookies, CSRF header and same-origin checks, header allow-lists, refuses token endpoints (sign-in goes through Server Actions)                                   |
| Customer session                                                   | JWE cookie (A256GCM) holding the customer token pair; refreshed in the proxy (as Shop Admin)                                                                                                                                                                            |
| Personal data                                                      | Cart, account and checkout are dynamic (Suspense / client); never in a cached shell                                                                                                                                                                                     |
| i18n                                                               | UI strings per language (en, vi …); catalog content comes localised from the API                                                                                                                                                                                        |

URL examples (default store `us-en`, `vn-vi` without a `baseUrl`):
`/` · `/tees/classic-tee` · `/vn-vi` · `/vn-vi/en-us/tees/classic-tee` (vn store, English).

## 3. Design direction — Ink Store

Same **Ink** neutral scale as Shop Admin (base `#191919`) and the same six accent presets (lime
default). The storefront is light-first and product-led, in the spirit of Mstore: monochrome
chrome, generous white space, large imagery, black primary buttons, the accent used sparingly
(promotions, highlights, "new"), red for sale prices. Full spec: `docs/STYLE-GUIDE.md`; live:
`/style-guide`.

## 4. Delivery plan

| Phase                       | Scope                                                                                                                                                                                                                                                                                                     | Done when                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0. Foundation**           | Scaffold; tokens, style guide (doc + `/style-guide`), UI kit; store routing; API client, gateway, customer session; shell (announcement bar, header with CMS menu, mobile menu, footer, store / language / currency switcher); home page (slider, banners, categories, product rail); i18n en / vi; tests | The home page of each demo store renders live from the shop API with its menu, slider and products; style guide published; gateway, session and routing covered by tests |
| **1. Catalog & search**     | Category pages (facets, sort, paging, sub-categories), product page (gallery, configurable options, bundles, gift cards, stock, related / upsell / cross-sell), search with suggestions, URL resolver catch-all and redirects, breadcrumbs, metadata + JSON-LD                                            | A shopper finds a product by browsing and by search and sees the right variant price and stock                                                                           |
| **2. Cart & checkout**      | Mini-cart drawer, cart page, coupons, loyalty points, one-page checkout (e-mail, addresses, shipping, payment), order placement, payment redirect / return, confirmation, guest order lookup                                                                                                              | An order is placed end to end with cash on delivery and with a redirect provider                                                                                         |
| **3. Customer account**     | Register, sign in / out, password, profile, addresses, order history and detail, cancel, loyalty, cart merge on sign-in                                                                                                                                                                                   | A customer signs up, orders, and sees the order in their account                                                                                                         |
| **4. Content, SEO & speed** | CMS pages, blog, block placements, banners; sitemaps, robots, hreflang, canonical; tag revalidation from shop webhooks; error pages; image strategy                                                                                                                                                       | Content published in Shop Admin appears on the storefront without a redeploy                                                                                             |
| **5. Market readiness**     | Accent presets in the theme switcher, buyer docs, demo mode, a11y audit, Lighthouse / CWV budgets, Playwright suite, packaging, licence, changelog                                                                                                                                                        | Release candidate passes `docs/RELEASE-CHECKLIST.md`                                                                                                                     |

## 5. Status

**Phases 0–5 — done (2026-10-07). Release candidate `1.0.0-rc.1`.** What is left before a
marketplace upload is listed under "Open items" below.

Phase 5 delivered:

- **Demo mode (`DEMO_MODE=true`):**
  - a banner and the accent picker (the picker exists only here and in the style guide, so live
    stores keep one brand colour);
  - orders, registration, password changes and every other account change are refused in the
    gateway **and** in the Server Actions; the cart and browsing stay open;
  - the flag is read per request (inside a Suspense hole), so cached pages are identical in every
    deployment.
- **Release tooling:** `1.0.0-rc.1`, `CHANGELOG.md`, `LICENSE` (Regular / Extended, placeholders
  to fill), `THIRD-PARTY-NOTICES.md` (`npm run notices`), `Dockerfile`, `.dockerignore`,
  `docker-compose.example.yml`, `npm run package` (allow-list zip).
- **Tests:** Playwright suite (`e2e/`): axe (WCAG 2.2 AA) on 12 screens in light and dark, three
  viewports, shopping, search, cart, guest checkout, accounts, demo mode; `npm run lighthouse`
  (fresh browser per run, budgets, CLS gate); `npm run lcp` (applied throttling).
- **Docs:** `docs/` — install, deploy, troubleshooting, testing, release checklist, index.
- **Fixes found by the new checks:**
  - sorted category pages (`?sort=price_asc` …) lacked `noindex`, contrary to the style guide;
  - the empty cart page shifted the layout (CLS 0.16 → 0.04) because its loading skeleton and
    empty state had different heights;
  - `format:check` failed in a clean checkout because the generated notices file wasn't ignored;
  - the Lighthouse script reused one browser for every run, which lowered scores by about five
    points (the plain CLI scored 94 where the script scored 88);
  - Lighthouse 12+ no longer evaluates budget files, so the size budgets never fired (Shop Admin's
    script has the same gap); the script now reads `lighthouse-budget.json` itself;
  - the mini-cart didn't return focus to "Add to cart" on Esc (the button is disabled while the
    request runs, so focus had dropped to the page); a small always-loaded tracker remembers the
    last focused element;
  - the demo refusal was English in the Vietnamese store; it is now translated in the gateway and
    in the Server Actions.

Release checks (record in `docs/RELEASE-CHECKLIST.md`):

- `npm run check` 421 tests; `npm run api:types` leaves the types unchanged; `npm audit --omit=dev` 0; build clean; Docker image 274 MB, healthy,
  non-root; a start without `SESSION_SECRET` exits with code 1; the clean-room build from the zip
  passes check and build.
- Playwright: 111 passed, 5 skipped (the demo specs, which need a `DEMO_MODE=true` storefront and
  passed there: 5 of 5).
- Lighthouse mobile on 9 pages: performance 91–94 (one sign-in run scored 89, then 92–94), accessibility 100, best practices 100, SEO 100
  (indexable pages), CLS ≤ 0.042.
- LCP with applied slow-4G and 4× CPU throttling: 0.73–0.85 s (cart page 2.06 s).
  Lighthouse's own _simulated_ LCP says 2.8–3.0 s, which doesn't match what a throttled load
  measures; see `docs/TESTING.md`.

Open items before selling:

1. **Demo imagery is illustration, not photography.** The seven demo images (Classic Tee in three
   colours, socks, the weekend set, gift card, gift box) were generated locally and added to the
   shop's media library; they are flat renderings, fine for screenshots of the theme but not a
   substitute for real product photography on a marketplace listing.
2. **`LICENSE` placeholders** (`[SELLER NAME]`, `[MARKETPLACE OR SELLER WEBSITE]`,
   `[CONTACT E-MAIL]`) and the listing screenshots.
3. **Manual pass** of the checklist's "light and dark, every preset, both languages" item by a
   person: the automated checks cover contrast, layout and flows, not taste. Also not automated on
   rc.1: finishing checkout with the keyboard only, and re-checking that content published in Shop
   Admin appears without a redeploy (verified on the Phase 4 build).
4. **Shop gaps the theme works around:** no e-mails, no forgotten-password endpoint, gift cards
   can't be bought online. The copy never promises them.

Phase 4 delivered:

- **Content:**
  - CMS pages (default, `wide` and `full-width` layouts, sidebar region) and the blog (index
    with tag chips and paging, posts with reading time and `BlogPosting` JSON-LD), all through
    the catch-all route;
  - block placements on categories, products, pages and posts;
  - content HTML is cleaned on the server; YouTube and Vimeo embeds are allowed (CSP
    `frame-src`).
- **SEO:**
  - `/sitemap.xml` index with one sitemap per store and language;
  - `robots.txt`; `hreflang` and absolute canonicals when `SITE_URL` is set;
  - a localized 404 (real status, store header and footer, top categories).
- **Freshness:**
  - every cached read is tagged by what it shows;
  - `/api/revalidate` checks the shop's webhook signature and maps each event to tags. Edits are
    served stale once and refreshed; deletions and unpublishing expire at once.
- **Shop API change:** the webhook catalogue gained the storefront content events (`category.*`,
  `page.*`, `post.*`, `block.*`, `block-placement.*`, `menu.*`, `menu-item.*`, `banner.*`,
  `slider.*`, `slide.*`, `price-book.entries-changed`, `url-rewrites.rebuilt`, `store.updated`).
- **Images:** the shop serves resized renditions, so the theme does no server-side image work (no
  sharp). Images below the fold are lazy, and the LCP image has high fetch priority.

Verified live on a production build:

- Content published in Shop Admin appeared without a redeploy:
  - a page title edit, a new post and a renamed menu item each showed within about 2 s;
  - an unpublished page returned 404 within 1 s;
  - all 13 webhook deliveries succeeded.
- axe (WCAG 2.2 AA) found no violations on content, blog and 404 pages in light and dark mode.
- Lighthouse mobile scored 91–94 for performance and 100 for accessibility, best practices and
  SEO on `/about`, `/blog` and a post.

Phase 3 delivered:

- **Authentication:**
  - sign-in, registration (password policy checked before the shop), sign-out (optionally
    everywhere) and password change, all as Server Actions writing the encrypted session;
  - the guest cart merges into the customer's cart on sign-in;
  - a readable `sf_signed_in` hint cookie (header dot, checkout prefill).
- **Gateway:**
  - the customer token is scoped to the customer's website;
  - no guest cart token is sent or stored for customers (a shared device can't reach their cart
    after sign-out);
  - a token the shop rejects clears the session in the same response.
- **Account area:**
  - guarded layout (sign in and come back to the same page);
  - overview, orders (paged) and order detail (the shared order view, embedded);
  - address book (add, edit, delete, defaults; the checkout address form);
  - profile (name, phone, language, marketing) and password;
  - points (balance, value, tier, expiry, activity).
- **Checkout:** a customer's e-mail fills the contact step; saved addresses can be picked.

Verified live:

- register → cart kept → checkout with e-mail prefilled → order → it appears in Orders and
  opens there;
- address add, edit and delete; profile save;
- password change (a wrong current password gets a field error; the new one keeps the customer
  signed in);
- points, sign out (all cookies cleared, badge 0), sign back in with the new password;
- the VN store asks the US customer to sign in (accounts are per website);
- axe clean on every account page; the production build is clean.

Found and fixed:

- the shop ends every session on a password change, which made account pages reload in a loop;
  now the action signs the customer back in, and any 401 clears the session and goes to sign-in;
- the password-change error reused the sign-in wording.

Phase 2 delivered:

- **Cart:**
  - a cart context that loads on demand;
  - a mini-cart drawer (opens on add and from the header, loaded on first use);
  - a cart page with lines, quantity, remove, discount code, totals, warnings and an empty state;
  - line display data (name, link, image, option labels) from a cached `/api/catalog/cards`
    endpoint.
- **Checkout:**
  - a distraction-free layout (route group) and a one-page, four-step flow saved step by step to
    the shop's cart;
  - an address form with autofill, `Intl` country names, US / CA region lists, region codes
    elsewhere, postcode rules and shop errors mapped to fields;
  - optimistic delivery choice, payment methods, coupon in the summary, and a mobile summary that
    folds away.
- **Orders:**
  - placing an order with an idempotency key per cart version;
  - payment started with a return URL: redirect providers leave and come back to
    `/checkout/return`, which has the shop verify the return;
  - order page with thanks, status, totals, addresses, Pay now (retry) and cancel;
  - the guest order token lives in an httpOnly cookie (gateway).
- **Platform:**
  - store / checkout route groups under the `[ctx]` root;
  - a skip link that targets the visible `<main>` (Next keeps hidden pages mounted);
  - `requireCtx()` on every store page;
  - the cards route runs per request (`connection()`).

Verified live against the shop:

- **Cash on delivery (US):** drawer, quantity, e-mail, address validation, express delivery,
  WELCOME10 coupon, order, confirmation; the badge returns to 0.
- **VNPay redirect (VN, Vietnamese UI):**
  - a correctly signed redirect (429.000 ₫);
  - a declined return (code 24) leads to an unpaid order with a retry;
  - "Thanh toán ngay" then a successful return marks it paid / processing;
  - the sandbox page itself was simulated locally, and the return was signed with the test
    secret.
- **axe** (WCAG 2.2 AA): cart, checkout (with errors) and order pages clean at 390 px. The
  production build is clean.

Found and fixed during verification:

- the shop rejects free-text regions, and the raw validation message reached the shopper;
- the checkout re-fetched the cart after every change, and a late response restored the badge
  after the order;
- the back-to-cart link had no name on phones;
- the skip link could target the hidden previous page;
- a build-time prerender crash on the return page and the cards route;
- the confirmation claimed an e-mail the shop never sends.

Phase 1 delivered:

- **URLs:**
  - a catch-all route resolves every catalog URL through the shop's URL rewrites;
  - the proxy answers shop redirects (301 / 302), non-canonical spellings (308) and unknown paths
    (404) before anything streams, from a 60 s in-memory resolution cache;
  - reserved theme routes are listed in `APP_ROUTES`.
- **Category pages:**
  - breadcrumbs, sanitised description, sub-category chips;
  - the merchandised order when unfiltered, the search index (facets, price range) when filtered
    or sorted by price;
  - colour swatches and option facets, price range, in-stock switch;
  - optimistic URL-driven filters, active chips, sort, crawlable pagination;
  - a filter drawer on phones (loaded on use);
  - past-the-end pages are `noindex` with a link back.
- **Product pages:**
  - gallery: thumbnails on desktop, swipe and counter on phones;
  - configurable options with availability (missing, sold out) and the variant's price, stock,
    images and SKU;
  - tier prices, a tax note, "Only n left";
  - a bundle builder with a live total;
  - gift cards (amounts, validity, a "not sold online yet" notice — shop API limit);
  - add to cart through the gateway (creates the cart, updates the badge);
  - description (sanitised on the server) and specifications;
  - related / upsell and cross-sell rails;
  - Product and BreadcrumbList JSON-LD, canonical, Open Graph.
- **Search:**
  - `/search` with the same filters, sort and paging, category chips and an empty state;
  - header overlay with live suggestions (combobox pattern, loaded on use, fresh on every
    opening);
  - search pages are `noindex`.
- **Platform:**
  - server-side HTML sanitiser for shop rich text;
  - intent-based link prefetching (no prefetch burst while hydrating);
  - separate hydration boundaries for footer and hero;
  - card headings at the right level in listings;
  - category meta descriptions fall back to a translated sentence.

Verified live against the demo data:

- browsing, filtering (optimistic), sorting, choosing a variant, adding a tee and a bundle (badge
  1 → 2), and suggestions with keyboard navigation all work in a real browser;
- status codes are correct for browsers and crawlers, and redirects stay relative behind a proxy;
- Lighthouse mobile (median of 3): performance 86–89, accessibility 100, best practices 100, SEO
  100 (search 60 because `noindex` is intended), LCP 2.1 s, CLS 0;
- single runs show 170–200 ms of blocking time against medians of 400–470 ms, because the API,
  worker and Docker share the machine — budgets are re-checked on a quiet machine in Phase 5.

Phase 0 delivered:

- **Scaffold:** Next.js 16 with Cache Components, standalone output, security headers / CSP, start-up
  configuration check, the same toolchain as Shop Admin.
- **Design system Ink Store:**
  - tokens: Ink scale, six presets, semantic, commerce and region roles, shape tokens,
    fluid type, 4 px spacing;
  - 28 contrast pairs tested in both modes and six presets (336 checks);
  - `docs/STYLE-GUIDE.md` and a live `/style-guide`.
- **UI kit:** button, badge, field / input / select, notice, price, product card, store image
  (renditions → `srcset`), quantity, section heading, drawer, skeleton.
- **Store routing:** `baseUrl` / `/<store-code>` / default store, a locale segment, a currency
  cookie, a rewrite to `[ctx]`; the routing table is read from `/store/config` and kept in memory
  with a last-good fallback.
- **Data:** a typed store API client and cached reads tagged per store.
- **Gateway** `/api/sf/*`:
  - store, locale and currency validation, CSRF, path guards;
  - cart, order and customer tokens kept in httpOnly cookies and stripped from responses;
  - a readable item-count cookie for the header badge;
  - sign-in endpoints refused.
- **Customer session:** JWE cookie and proxy refresh (store-aware).
- **Shell:**
  - announcement bar;
  - sticky header with the CMS main menu (dropdowns), search, account and cart badge;
  - lazy-loaded mobile drawer;
  - footer with shop and help links and store / language / currency / appearance preferences.
- **Home:** an accessible hero carousel (pause, labels, reduced motion), promo banners, category
  tiles, a product rail and service perks.
- **i18n:** English and Vietnamese with key-parity tests.

Verified live against the shop's demo data:

- `/`, `/vn-vi` and `/vn-vi/en-us` render their stores' menus, slider, banner, categories and
  products in USD and VND;
- repeat requests are served from the cache (~5 ms vs ~350 ms);
- the gateway created a cart, added an item, and kept the token out of the browser;
- Lighthouse mobile on the home pages: performance 91 / 93, accessibility 100, best practices 96,
  SEO 100.

Carried forward:

- Header and home links point to routes of later phases (`/men` → Phase 1, `/search` → Phase 1,
  `/cart` → Phase 2, `/account` → Phase 3). Until then they 404, and their prefetches log console
  errors (best practices 96).
- ~~The 404 page is English-only~~ — localized in Phase 4.
- Demo products and slides have no images. The theme handles that gracefully, but marketplace
  screenshots need demo photography (Phase 5).
- Slider and banner text comes from the shop untranslated where the demo data has only one
  language.
