# Ink Store — style guide

The design system of the Shop Storefront theme. **Every layout change follows this document.**
The live version, with real components and contrast measured in the current mode and preset, is at
`/style-guide`.

Ink Store shares its foundations with Shop Admin's **Ink** system (base colour `#191919`, the
same neutral scale and the same six accent presets). It differs in purpose: the storefront is
light-first, product-led and built for phones first.

---

## 1. Principles

1. **Product first.** Chrome is monochrome so photography carries the colour. The accent appears
   sparingly: highlights, "new", active states, one decorative moment per view.
2. **One primary action per view.** A single black primary button (add to cart, checkout,
   place order). Everything else is secondary, ghost or a link.
3. **Readable everywhere.**
   - Body text is 16 px.
   - Touch targets are at least 44 × 44 px.
   - WCAG 2.2 AA contrast holds in both modes and every preset (`src/theme/tokens.test.ts`).
4. **Fast by default.**
   - Catalog and content pages are cached per store.
   - Images come at the right size.
   - Only one image per page loads with priority.
   - Motion is short and switched off with reduced motion.
5. **Tokens, not values.** Components use semantic and role tokens (`bg-surface`,
   `text-fg-muted`, `rounded-button`), never raw hex or ad-hoc sizes.

## 2. Colour

### 2.1 Ink — neutral scale (from `#191919`)

| Token     | Hex       | Typical use                                            |
| --------- | --------- | ------------------------------------------------------ |
| `ink-950` | `#0F0F0F` | Footer (light mode), page background (dark mode)       |
| `ink-900` | `#191919` | **Base.** Text, primary button, hero, announcement bar |
| `ink-800` | `#232323` | Dark surfaces, image wells (dark)                      |
| `ink-700` | `#2E2E2E` | Primary hover, dark borders                            |
| `ink-600` | `#3D3D3D` | —                                                      |
| `ink-500` | `#5C5C5C` | Secondary text (`fg-muted`), empty-image icon          |
| `ink-400` | `#8A8A8A` | Control boundaries (`border-strong`)                   |
| `ink-300` | `#B8B8B8` | Text on dark (hero copy, footer links)                 |
| `ink-200` | `#E4E4E2` | Dividers, card outlines (`border`)                     |
| `ink-100` | `#EFEFED` | Image wells (`media`), pressed fills                   |
| `ink-50`  | `#F6F6F4` | Section bands (`surface-muted`)                        |

### 2.2 Accent presets

| Preset             | 400 (fill) | 700 (text on white) | Feel                                        |
| ------------------ | ---------- | ------------------- | ------------------------------------------- |
| **Lime** (default) | `#C3EB4D`  | `#5C7A0E`           | Fresh, energetic; the Mstore-like signature |
| Cobalt             | `#7D94FF`  | `#3448C5`           | Tech, electronics                           |
| Coral              | `#FF9B7D`  | `#B4421F`           | Beauty, lifestyle                           |
| Teal               | `#4FD1BD`  | `#0F6E62`           | Wellness, outdoor                           |
| Amber              | `#FFC24B`  | `#8A5A00`           | Food, kids, warm brands                     |
| Violet             | `#B69CFF`  | `#5B37C4`           | Fashion, creative                           |

Fills always pair with ink text (`accent-fg`). Accent-coloured **text** uses `accent-text` (the 700
step in light mode, the 300 step in dark mode).

### 2.3 Semantic tokens

| Token                                                  | Light                             | Dark                              | Use                                        |
| ------------------------------------------------------ | --------------------------------- | --------------------------------- | ------------------------------------------ |
| `bg`                                                   | `#FFFFFF`                         | `ink-950`                         | Page                                       |
| `surface`                                              | `#FFFFFF`                         | `ink-900`                         | Drawers, inputs, popovers                  |
| `surface-muted`                                        | `ink-50`                          | `ink-900`                         | Section bands, promo panels, filter panels |
| `surface-sunken`                                       | `ink-100`                         | `ink-800`                         | Hover and pressed fills, skeletons         |
| `fg` / `fg-muted` / `fg-subtle`                        | `ink-900` / `ink-500` / `#6B6B69` | `#F2F2F0` / `ink-300` / `#A3A3A1` | Text levels                                |
| `border` / `border-strong`                             | `ink-200` / `ink-400`             | `ink-700` / `#6E6E6E`             | Dividers / controls                        |
| `primary` / `primary-fg`                               | `ink-900` / white                 | `#F2F2F0` / `ink-900`             | Primary button (inverts in dark)           |
| `accent` / `accent-fg` / `accent-soft` / `accent-text` | preset                            | preset                            | Highlights                                 |
| `ring`                                                 | `ink-900`                         | `accent-400`                      | Focus outline                              |
| `overlay`                                              | ink at 50 %                       | black at 60 %                     | Behind drawers                             |

### 2.4 Commerce roles

| Token                                  | Value (light)                   | Use                                  |
| -------------------------------------- | ------------------------------- | ------------------------------------ |
| `price`                                | `fg`                            | Current price                        |
| `price-compare`                        | `fg-muted`                      | Was-price, struck through            |
| `sale` / `sale-fg`                     | `#C62828` / white               | Sale price text; sale badge          |
| `new` / `new-fg`                       | accent-400 / ink                | "New" badge                          |
| `stock-in` / `stock-low` / `stock-out` | success / warning / danger text | Availability                         |
| `media` / `media-fg`                   | `ink-100` / `ink-500`           | Image well and the empty-image state |

### 2.5 Regions

Each region has its own tokens, so a buyer can restyle a region without editing components (for
example, a light footer, or an announcement bar in the accent colour).

| Region           | Background                       | Text                                                               | Notes                                             |
| ---------------- | -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| Announcement bar | `announce-bg` (ink-900)          | `announce-fg` (white), `announce-link` (accent)                    | Accent fill with ink text in dark mode            |
| Header           | `header-bg` (white, 92 % + blur) | `header-fg`                                                        | Sticky; 1 px `border` bottom                      |
| Hero             | `hero-bg` (ink-900)              | `hero-fg` white, `hero-muted` ink-300                              | Gradient overlay on photos                        |
| Body             | `bg`                             | `fg`                                                               | Sections alternate `bg` and `surface-muted` bands |
| Footer           | `footer-bg` (ink-950)            | `footer-fg` white, `footer-muted` ink-300, `footer-border` ink-700 | —                                                 |

### 2.6 Status

`success`, `warning`, `danger` and `info` each come as a trio: a solid colour, a `-soft` fill and a
`-fg` text colour. Notices and badges use `-fg` on `-soft`.

## 3. Typography

- **Family:** Inter (variable), self-hosted with latin and Vietnamese subsets. Headings use the
  same family with tighter tracking. A second display family cost two extra font files on the
  critical path in testing (LCP 3.5 s → 2.1 s without it).
- **Fluid scale:** headings scale linearly between 360 px and 1440 px wide (`clamp()`). Body text
  is fixed at 16 px, so iOS never zooms into fields.

| Token           | 360 → 1440 px | Line height | Weight · tracking | Use                                  |
| --------------- | ------------- | ----------- | ----------------- | ------------------------------------ |
| `text-display`  | 40 → 72       | 1.05        | 600 · −3 %        | Hero headline (one per page)         |
| `text-h1`       | 30 → 48       | 1.1         | 600 · −2.5 %      | Page title (category, product name)  |
| `text-h2`       | 24 → 36       | 1.15        | 600 · −2 %        | Section title                        |
| `text-h3`       | 20 → 24       | 1.3         | 600 · −1 %        | Sub-section, promo title, tile label |
| `text-h4`       | 17 → 18       | 1.4         | 600               | Drawer title, footer heading         |
| `text-body-lg`  | 17 → 18       | 1.6         | 400               | Lead, product description            |
| `text-body`     | 16            | 1.5         | 400               | Default                              |
| `text-small`    | 14            | 1.45        | 400–500           | Product card name, meta, table cells |
| `text-caption`  | 12            | 1.35        | 500               | Badges, helper text, legal           |
| `text-overline` | 12            | 1.35        | 600 · +8 %, caps  | Eyebrows above titles                |

Rules:

- One `h1` per page.
- Headings use `text-wrap: balance` and paragraphs `pretty`.
- Prices use tabular figures (`tabular`).
- Body text is capped at about 70 characters per line (`max-w-2xl` / `max-w-xl`).

## 4. Layout and spacing

- **Grid:** 4 px base. Spacing steps are 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 and 96.
- **Container:** `container-page` gives a maximum width of 1320 px plus the gutter on each side.

| Breakpoint  | Gutter | Section rhythm (`--section-y`) | Product grid                        | Header                      |
| ----------- | ------ | ------------------------------ | ----------------------------------- | --------------------------- |
| < 768 px    | 16     | 48                             | 2 columns, 12 px gap, 32 px row gap | 64 px, menu drawer          |
| 768–1279 px | 24     | 64                             | 3 columns, 24 px gap                | 64 px; drawer below 1024 px |
| ≥ 1280 px   | 40     | 96                             | 4 columns, 24 px gap                | 72 px, inline menu          |

- **Vertical rhythm:** each home section adds `--section-y` above itself, never below, so
  neighbouring sections never double the gap.
- **Aspect ratios:**
  - product images 4:5
  - category tiles: 1:1 with three or more, 4:5 on phones and 3:2 on desktop with two or fewer
  - promo banners 4:3 on phones
  - hero: up to 640 px or 70 % of the viewport height
- **Breakpoints:** Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).
- **Overflow:** nothing may scroll sideways at 360 px. Wide content (tables) scrolls inside its own
  container.

## 5. Shape and elevation

| Token              | Default          | Applies to                           |
| ------------------ | ---------------- | ------------------------------------ |
| `--radius-button`  | 999 px (pill)    | Buttons, quantity stepper            |
| `--radius-control` | 10 px            | Inputs, selects, notices             |
| `--radius-card`    | 16 px            | Promo panels, category tiles, cards  |
| `--radius-media`   | 12 px            | Product images                       |
| `--radius-xs … xl` | 4, 6, 10, 16, 24 | Everything else (the hero uses `xl`) |

Set the four shape tokens to `0`–`4px` for a square, editorial look; nothing else changes.

Shadows go from `shadow-xs` to `shadow-lg` and are used sparingly:

- `md` for dropdowns;
- `lg` for drawers;
- product cards have none (the image well carries the shape).

## 6. Components

All components are in `src/components/ui/`; see them live in `/style-guide`.

| Component                     | Sizes and states                                    | Rules                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                    | `sm` 36 · `md` 44 (default) · `lg` 52; icon 44 / 36 | Variants: `primary`, `secondary` (outline), `ghost`, `accent`, `inverse` / `inverse-outline` (dark regions), `link`. `loading` keeps the width. Pressed state scales to 98 %. |
| **Badge**                     | 24 px tall, pill                                    | Tones: `sale`, `new`, `inverse` (sold out), `neutral`, `success`, `warning`, `danger`, `outline`. At most two per product card.                                               |
| **Input / Select / Textarea** | 48 px, 16 px text                                   | Native `<select>` (fast, accessible). `Field` wires the label, hint and error (`aria-describedby`); `aria-invalid` draws the danger border.                                   |
| **Notice**                    | Inline                                              | `danger` is announced (`role="alert"`).                                                                                                                                       |
| **Quantity**                  | 44 / 36 px                                          | − n +, typed input allowed, clamped to min and max.                                                                                                                           |
| **Price**                     | `sm` / `md` / `lg`                                  | Formatted by the shop. A sale shows the sale colour plus the struck-through was-price with screen-reader labels. `from` for configurable products and bundles.                |
| **StoreImage**                | —                                                   | `srcset` from the shop's renditions, intrinsic size (no layout shift), lazy except the one `priority` image. The empty state is the same shape.                               |
| **ProductCard**               | Width from the grid                                 | 4:5 image, up to two badges top left, name (2 lines), price. The whole card is a single link.                                                                                 |
| **SectionHeading**            | —                                                   | Optional eyebrow, `h2`, description (max 2xl), "View all →" link on the right.                                                                                                |
| **Sheet (drawer)**            | Full width on phones, 420 px from `sm`              | Cart (right), navigation and filters (left). Traps focus, closes with Esc, returns focus to its opener.                                                                       |
| **Skeleton**                  | Same size as the content                            | Pulse animation, none with reduced motion.                                                                                                                                    |

## 7. Commerce patterns

- **Product card:** as in §6, at 2 / 3 / 4 columns. Hovering darkens the image slightly; the
  image itself never moves.
- **Prices:** never re-format a price on the client; the shop formats for the store's locale and
  currency (VND has no decimals, USD has two). Show the sale percentage only when it is 1 % or more.
- **Availability:** "Sold out" is the `inverse` badge on cards. Product pages (Phase 1) state
  availability in words, not by colour alone.
- **Empty images:** demo data and new products may have no photo. The placeholder keeps the grid
  calm (`media` well, a 24 px icon at 60 %).

## 8. Regions and page anatomy

```
┌ Announcement bar · 36 px · ink-900 ─────────────────────────────┐
├ Header · sticky · 64 / 72 px ───────────────────────────────────┤
│ [☰]  Logo    Men  Accessories  Blog  About         🔍  👤  🛍(2) │
├ Main ───────────────────────────────────────────────────────────┤
│  Hero (rounded-xl, ink, display headline, inverse CTA, dots ⏸ ‹ ›)│
│  Promo banners (surface-muted panels)                           │
│  Shop by category (tiles)                                       │
│  New in (product grid + View all →)                             │
│  Service perks (3 columns, accent-soft icon discs)              │
├ Footer · ink-950 ───────────────────────────────────────────────┤
│  Brand · tagline | Shop | Help | Store preferences (store,      │
│  language, currency, light / dark)                              │
│  © year name                                                    │
└─────────────────────────────────────────────────────────────────┘
```

- **Header:**
  - Phones show the menu button, the centred logo, search and cart.
  - From 1024 px the CMS "main" menu is inline, with dropdowns for children.
  - The cart badge is client-side, so cached pages stay shared.
- **Hero:**
  - Slides come from the shop's `home` slider.
  - A slide with a photo gets a bottom-to-top (phones) or left-to-right (desktop) gradient for
    legibility.
  - Slides without photos get the ink panel: accent glow, a fine grid, and an accent ring at the
    top right, kept away from text and controls.
  - Autoplay runs every 6 s, with a pause button. It pauses on hover or focus, and is off with
    reduced motion.
- **Footer:**
  - Store and language are URLs; the currency is a cookie (the page reloads).
  - Appearance is stored on the device.

## 9. Icons

- Lucide icons with stroke 1.75: 16 px in text, 18–20 px in buttons, 22–24 px in the header.
- Decorative icons are `aria-hidden`.
- Icon-only controls always have an accessible name.

## 10. Motion

| Token             | Duration | Use             |
| ----------------- | -------- | --------------- |
| `--duration-fast` | 120 ms   | Hover, press    |
| `--duration-base` | 200 ms   | Fades, popovers |
| `--duration-slow` | 320 ms   | Drawers         |

- Easing: `--ease-emphasized` for entrances, `--ease-standard` otherwise.
- `prefers-reduced-motion` sets every duration to 0 and stops the hero autoplay.

## 11. Accessibility checklist

- Each page has a skip link to `#main` and exactly one `h1`.
- Every element shows a visible focus ring (`ring`, 2 px, 2 px offset).
- Touch targets are at least 44 px. Contrast meets AA for text (4.5:1) and controls (3:1).
- Carousels have a pause button and slide labels. Drawers trap focus and return it on close.
- Language is set per page (`<html lang>`), and language options carry their own `lang`.
- Never convey state by colour alone (sale = colour plus struck-through price plus a
  screen-reader label).

## 12. Changing the design

1. Change **tokens** (`src/theme/tokens.css`) or **theme config** (`src/theme/config.ts`), not
   component classes. See `docs/THEMING.md`.
2. Add any new text/background pair to `contrastPairs` in `src/theme/tokens.ts`, then run
   `npm test`.
3. New components go in `src/components/ui/`, use tokens only, and appear on `/style-guide`.
4. Update this document in the same change.

## 13. Page patterns

### 13.1 Category page

```
Breadcrumb (Home › … › Category)
H1 category name · description (rich text, max 3xl)
Sub-category chips (children; siblings + "All" on a leaf) — scroll sideways on phones
┌ Filters 240 px (≥ 1024, sticky) ┬ Count · [Filters (n)] (< 1024) · Sort ─────────────┐
│ Facets: checkboxes, colour       │ Active filter chips × · Clear all                   │
│ swatches (24 px), counts         │ Product grid 2 / 3 / 3 (with sidebar)               │
│ Price min–max + Apply            │ Pagination (page window) · "Showing 1–24 of N"      │
│ In stock only (switch)           │                                                     │
└──────────────────────────────────┴─────────────────────────────────────────────────────┘
```

- **Filters and sorting live in the URL**: `?color=red,blue&size=m&price=10-50&stock=1&sort=…&page=2`.
  They are shareable, crawlable, and work with the back button.
- **Controls update optimistically.** The results stay visible at 50 % opacity (`aria-busy`)
  until the new page arrives.
- **Unfiltered listings** use the shop's merchandised order ("Featured"). Filters, search and
  price sorting use the search index, which also provides the facets.
- **The price filter** shows only in the store's default currency, because the shop filters
  prices in that currency.
- **On phones,** filters open in a left drawer with a "Show N results" button.

### 13.2 Product page

```
Breadcrumb
┌ Gallery (55 %): 4:5 main + thumbnails | swipe + 1/4 counter on phones ┬ Buy box (sticky)       ┐
│                                                                        │ H1 · price (sale)      │
│                                                                        │ tax note · tier prices │
│                                                                        │ short description      │
│                                                                        │ Colour: swatches 44 px │
│                                                                        │ Size: 44 px chips      │
│                                                                        │ ● stock line           │
│                                                                        │ [− 1 +] [Add to cart]  │
│                                                                        │ shipping · returns·SKU │
└────────────────────────────────────────────────────────────────────────┴────────────────────────┘
Description (rich text) | Specifications (definition list)
You may also like (related + upsell) · Complete the look (cross-sell)
```

- **Options:**
  - Unavailable combinations are disabled.
  - Sold-out values are struck through (chips) or crossed (swatches), with "— sold out" in the
    accessible name.
  - The first option (usually colour) starts on its first value in stock; sizes are left for the
    shopper.
- **Add to cart:**
  - The button says what's missing ("Choose size") until it's ready.
  - Success is announced inline with a "View cart" link, and the header badge updates.
- **Stock:** "Only n left" appears at 5 or fewer (managed stock); out of stock reads "Sold out".
- **Bundles:** a "Build your set" panel (surface-muted) with radio or checkbox rows and a live total.
- **Gift cards:** amounts and validity, plus an info notice while the shop can't sell them online.
  Shipping and returns promises are hidden.

### 13.3 Search

- **The search icon is a real link** to `/search` and works without JavaScript. With JavaScript,
  it opens an overlay instead: a combobox showing up to 6 suggestions from 2 characters (180 ms
  debounce), the typed text in bold, and "See all results for …" last. Arrow keys move, Enter
  opens, Esc closes.
- **The results page** reuses the category layout, adds category chips with counts, and is
  `noindex`.

### 13.4 Cart

- **Mini-cart (right drawer):**
  - opens after "Add to cart" and from the header bag (which is still a real link to `/cart`
    without JavaScript);
  - shows lines with a 72 px image, options as "Colour: Black · Size: M", quantity stepper and
    remove;
  - totals, then **Checkout** (primary) and **View cart** (secondary).
- **Cart page:** lines on the left; on the right a summary panel (`surface-muted`, sticky) with the
  discount code, totals and Checkout. The empty state links back to the shop.
- **Totals order:** subtotal, promotions (by name, in the sale colour), shipping ("Calculated at
  checkout" until chosen), tax (or "Including … tax" in tax-inclusive stores), points, then the
  **Total** in `text-h4`.
- **Loading:** the cart loads only when needed (drawer, cart, checkout). The header badge reads a
  cookie the gateway keeps in step, so other pages make no cart request.

### 13.5 Checkout

```
┌ ← Back to cart          Logo          🔒 Secure checkout ┐   (no menus, no promotions)
├──────────────────────────────────────────┬───────────────┤
│ ① Contact            ✓ e-mail     Edit   │ Order summary │
│ ② Shipping address   form / summary      │ lines (read)  │
│ ③ Delivery           radio cards         │ discount code │
│ ④ Payment            radio cards         │ totals        │
│ [🔒 Place order · $69.27]  terms note     │  (sticky)     │
└──────────────────────────────────────────┴───────────────┘
Phones: "Show order summary · total" folds above the steps.
```

- **Steps:**
  - Each step is saved to the shop's cart when completed, so taxes and shipping are re-priced by
    the shop.
  - Completed steps collapse to a one-line summary with **Edit**.
  - The open step has an ink outline badge; done steps have a filled check.
- **Address form:**
  - autofill tokens throughout;
  - country names come from `Intl` in the shopper's language, with the store's country first;
  - US and Canadian states / provinces are a select; elsewhere an optional uppercase **code**
    (the shop stores codes, not names);
  - the postcode is required where couriers need it;
  - errors appear under each field after the first attempt, and focus moves to the first one;
  - shop validation errors are mapped to fields, never shown raw.
- **Delivery:** radio cards with name, description and price ("Free" when 0). A single option is
  chosen automatically, and the choice applies immediately (optimistic).
- **Place order:** the button shows the total, and its label says what's happening ("Placing your
  order…", "Taking you to the payment page…"). One idempotency key per cart version means a double
  click can't place two orders.

### 13.6 Payment and order page

- **Redirect providers** (VNPay, PayPal, MoMo …):
  - the shopper leaves for the provider and comes back to `/checkout/return`;
  - the return page sends the provider's parameters to the shop, which verifies them;
  - nothing on the page trusts the URL alone.
- **Order page** (`/orders/<number>`, `noindex`):
  - a thank-you banner after placing;
  - status and payment badges, lines, totals, ship-to (bill-to only when different) and delivery;
  - unpaid orders offer **Pay now** with a method choice;
  - orders awaiting payment can be canceled after an inline confirmation;
  - guests open it with an httpOnly order cookie (90 days) on the device they ordered from.
- **Copy:** the shop doesn't send e-mails, so the confirmation never claims one was sent.

### 13.7 Account

- **Sign in and register:**
  - a centred card (max 448 px) on the page background;
  - fields follow §6, with a show / hide password button (44 px, `aria-pressed`);
  - errors appear inline and the form keeps the values entered (never the password);
  - the password rule is stated up front (12+ characters, three kinds), and the form explains a
    weak password before the shop has to refuse it.
- **Account area:**
  - a 220 px sidebar (Overview · Orders · Addresses · Profile · Points · Sign out) on desktop, a
    horizontally scrolling pill row on phones;
  - pages use `text-h2` titles;
  - empty states use the round-icon pattern (`surface-muted` card, 56 px icon disc).
- **Overview:** greeting, e-mail and member-since; recent orders (rows with status badge and
  total); points and default address tiles.
- **Points:** the balance on the hero ink panel with its value, tier badge, next-tier progress,
  expiry warning and recent activity (+ points in `stock-in`).
- **Header:** the account icon gets a 10 px `stock-in` dot when a customer is signed in on this
  device. It comes from a cookie, so cached pages stay shared.

### 13.8 Content pages and blog

Content comes from Shop Admin → Content; its HTML is cleaned on the server before rendering.

- **CMS page:**
  - breadcrumb, `text-h1` title and "Updated …" date, then the content;
  - the default layout keeps text to a 768 px reading width (`max-w-3xl`); the `wide` and
    `full-width` layouts use the whole container;
  - a block placed in the `sidebar` region adds a 300 px `surface-muted` column from `lg`.
- **Rich text (`.prose-store`):**
  - `text-body-lg` in `fg-muted`, with `h2` at `text-h3` and `h3`/`h4` at `text-h4` (the page
    owns the only `h1`, so content `h1`s become `h2`);
  - links are always underlined; quotes have a 3 px accent rule; tables use `text-small`;
  - images get `radius-media`; YouTube and Vimeo embeds are lazy and 16:9. Other iframes,
    scripts and inline event handlers are removed.
- **Blog index:**
  - `text-h1` title and intro (`max-w-2xl`), a scrolling row of tag chips, then cards in 1 / 2 / 3
    columns (`gap-x-6 gap-y-12`);
  - card: 3:2 image (or an ink panel with an accent dot), date in `text-caption`, title in
    `text-h4` (the whole card is the link), a three-line excerpt;
  - tag pages and pages after the first are `noindex, follow`.
- **Post:** a centred header (an overline with the date and reading time, `text-h1`, excerpt,
  tag badges), a 16:9 featured image, then the content at reading width, ending with a link back to the
  blog. Posts carry `BlogPosting` and breadcrumb JSON-LD.
- **Block placements:** blocks placed on a category, product, page or post render in their
  region: `top` above the content, `bottom` below it (on categories, page 1 only; on products,
  before the recommendation rails).

### 13.9 Not found

- A real 404 in the store's language: a large `fg-subtle` "404" (88 px display type), a
  `text-h1` title, one line of help, **Back to the shop** (primary, `lg`) and pill links to the
  top categories.
- It keeps the header and footer, so the shopper can search or browse from it.

### 13.10 Demo mode

For showcase installs only (`DEMO_MODE=true`); a live store never shows it.

- **Demo bar:** a strip above the announcement bar, `surface-muted` with a bottom border, at least
  44 px high. It holds an accent-coloured "Demo" badge (`text-caption`, uppercase), one sentence of
  what is switched off, and the accent picker, and it wraps onto two lines on phones.
- **Accent picker:** six 32 px round targets (28 px on phones, inside a 44 px-high bar), each with a
  swatch and the preset's name as its label; the chosen one is highlighted and `aria-pressed`. The
  choice is kept in local storage and applied before first paint.
- **Refusals:** orders, registration and account changes answer with one plain sentence in the
  form's error notice. The cart, search and browsing stay open.

## 14. Links, URLs and status codes

- **Prefetching:** use `Link` from `@/components/intent-link`. It prefetches on hover, focus or
  touch rather than on entering the viewport, so pages full of cards don't send a burst of
  requests while hydrating.
- **URLs:**
  - Build every storefront URL with `href(path, prefix)`; stores can live under a prefix.
  - URLs come from the shop's URL rewrites. Paths beginning with a reserved segment (`search`,
    `cart`, `checkout`, `account`, `orders`) belong to the theme.
- **Status codes:** the proxy decides them before anything streams.
  - Shop redirects: 301 / 302.
  - Other spellings of a URL: 308 to the canonical one.
  - Unknown paths: a real 404.
  - Pages past the end of a listing: 200 with `noindex` and a link back to page 1.
- **SEO:**
  - Every catalog and content page has a canonical URL (absolute when `SITE_URL` is set).
  - With `SITE_URL`, pages also list their other languages (`hreflang`, plus `x-default`).
  - Product, post and breadcrumb JSON-LD carries only facts the shop provides.
  - Filtered, sorted and search pages are `noindex, follow`.
  - `/sitemap.xml` is an index with one sitemap per store and language (categories, products,
    blog, posts, and CMS pages linked from menus). `robots.txt` keeps crawlers out of the cart,
    checkout, account, order and API paths.
- **Freshness:** pages are cached, and shop webhooks tell `/api/revalidate` what changed.
  - Edits show up on the next request, while the old page is served once in the background.
  - Content that is deleted or unpublished is removed at once.
