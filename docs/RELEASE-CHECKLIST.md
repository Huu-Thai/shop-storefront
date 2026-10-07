# Release checklist

Work through this list for every release, including releases of your own customised copy. A
release candidate ships only when every box is ticked. Record the results at the end.

## 1. Version and notes

- [ ] `package.json` → `version` bumped. Use semver: `-rc.N` for candidates.
- [ ] `CHANGELOG.md` has a section for this version, with **Breaking** changes and the shop API
      version it needs.
- [ ] The style guide header shows the new version (`/style-guide`, read from `package.json`).
- [ ] `LICENSE` placeholders (`[SELLER NAME]`, `[MARKETPLACE OR SELLER WEBSITE]`,
      `[CONTACT E-MAIL]`) filled in for the marketplace upload.

## 2. Code quality

- [ ] `npm ci` installs with no errors.
- [ ] `npm run check` is clean: types, lint, format, unit tests including token contrast for every
      accent preset.
- [ ] `npm audit --omit=dev` reports **0** vulnerabilities.
- [ ] `npm run notices` re-generated `THIRD-PARTY-NOTICES.md`, and no new copyleft licence appears
      in the production dependencies.
- [ ] `npm run api:types` against the target shop API leaves `src/server/shop-api.d.ts` unchanged,
      or the changes are handled.

## 3. Build and package

- [ ] `npm run build` finishes with no errors or warnings.
- [ ] `docker build -t shop-storefront .` succeeds. The container starts, and `/api/health`
      answers `{"status":"ok"}`.
- [ ] A start without `SESSION_SECRET` stops with _Invalid shop-storefront configuration_ (exit
      code 1).
- [ ] `npm run package` creates `dist/shop-storefront-<version>.zip`, and the archive holds:
  - no `.env` file other than `.env.example`
  - no `e2e/.auth`, `node_modules`, `.next` or reports
- [ ] **Clean-room build:** unzip the archive into an empty folder, then run
      `npm ci && npm run check && npm run build`. All three must pass.

## 4. Live checks (against a shop API with demo data: two stores, two languages, a blog post, a CMS page)

- [ ] Playwright: `E2E_ORDERS=1 npm run test:e2e` passes in every project (desktop-1440,
      tablet-768, phone-360, customer). Skips are allowed only for the demo spec.
- [ ] Demo: a storefront with `DEMO_MODE=true` passes the demo spec (`E2E_DEMO=1`, see
      [Testing](TESTING.md)), and a normal one shows no banner and no accent picker.
- [ ] Lighthouse: `npm run lighthouse` reports performance ≥ 90 and accessibility, best practices
      and SEO ≥ 95 on every audited page (SEO on `noindex` pages: every audit but "indexing"), and no
      budget is exceeded.
- [ ] Core Web Vitals on the audited pages: `npm run lcp` reports LCP ≤ 2.5 s (applied slow-4G and
      4× CPU throttling), and `npm run lighthouse` reports CLS ≤ 0.1.
- [ ] Content check: a page title, a new blog post and a renamed menu item edited in Shop Admin
      appear without a redeploy (webhook configured), and an unpublished page gives 404 at once.
- [ ] Manual pass in **light and dark** mode, with **every accent preset** (demo mode), in
      **English and Vietnamese**, on a phone-width window:
  - browse, filter, search
  - a product with options, added to the cart
  - checkout as a guest with cash on delivery
  - sign up, the account pages, sign out
  - the blog and a CMS page
  - the style guide
- [ ] Keyboard only:
  - the skip link works
  - the search overlay opens, arrow keys move through suggestions, Esc closes it
  - the cart drawer traps focus, closes with Esc and returns focus to what opened it
  - checkout can be completed
- [ ] Search engines: `/sitemap.xml` lists the stores and languages, `robots.txt` blocks the cart,
      checkout and account, and a product shows `hreflang` for its other languages.

## 5. Documentation

- [ ] `README.md`, and `docs/` (install, deploy, troubleshooting, theming, extending, testing),
      match this release's variables, scripts and screens.
- [ ] Screenshots for the marketplace listing are taken from this build (see "Open items").

## 6. Clean-up

- [ ] Test customers, orders and webhooks created for the checks are removed from shared
      environments.
- [ ] Test passwords, saved sessions (`e2e/.auth`) and temporary files are deleted.

---

## Record

| Version    | Date       | check        | audit | build | docker                       | clean-room          | e2e (pass / skip)                                                                   | Lighthouse (min perf / a11y / bp / seo)                                                                      | By                                        |
| ---------- | ---------- | ------------ | ----- | ----- | ---------------------------- | ------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| 1.0.0-rc.1 | 2026-10-07 | ✅ 421 tests | ✅ 0  | ✅    | ✅ 274 MB, healthy, non-root | ✅ Node 24 / npm 11 | ✅ 111 / 5 (the 5 demo specs are skipped here; run against `DEMO_MODE=true` ✅ 5/5) | 91–94 / 100 / 100 / 100 (one sign-in run 89; 92–94 on rerun); LCP 0.7–0.9 s applied (cart 2.1 s); CLS ≤ 0.04 | Claude (production build, local shop API) |

The rc.1 record covers sections 2–4 and the clean-up, except:

- the manual light / dark / every-preset / both-language pass (axe, contrast, layout and the flows
  above stand in for it);
- keyboard-only **checkout** (the skip link, search overlay and cart drawer are tested);
- the content-without-redeploy check (done on the Phase 4 build, not repeated on rc.1);
- the `LICENSE` placeholders and the listing screenshots.

`npm run api:types` leaves `src/server/shop-api.d.ts` unchanged.

## Open items

- **Demo imagery.** The demo products carry generated illustrations, not photographs. Use real
  photography in the shop's media library for the marketplace listing.
- Fill in the `LICENSE` placeholders.
