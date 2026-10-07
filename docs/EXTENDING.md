# Extending Shop Storefront

## Folder conventions

| Folder                            | What goes there                                                 |
| --------------------------------- | --------------------------------------------------------------- |
| `src/app/(store)/[ctx]/…`         | Store pages (the proxy rewrites public URLs here)               |
| `src/components/ui`               | Design-system components (tokens only; shown on `/style-guide`) |
| `src/components/shell`, `home`, … | Page regions and sections                                       |
| `src/server`                      | Server-only code: API client, cached reads, gateway, session    |
| `src/lib`                         | Code shared by server and browser (routing, preferences)        |
| `src/i18n`                        | UI strings per language                                         |

## 1. Add a page

Create `src/app/(store)/[ctx]/<path>/page.tsx`. Get the store with `requireCtx()` and build links
with `href(path, await getPrefix(ctx))` — never hard-code `/`, the store may live under a prefix.

```tsx
export default async function Page() {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  const prefix = await getPrefix(ctx);
  …
}
```

Paths starting with `search`, `cart`, `checkout`, `account` or `orders` are theme routes
(`APP_ROUTES` in `src/lib/routing.ts`); every other path is resolved through the shop's URL
rewrites by the catch-all route. Add your own top-level route to `APP_ROUTES` too, or the proxy
will ask the shop about it (and 404 it).

Links: import `Link` from `@/components/intent-link` (prefetch on intent, docs/STYLE-GUIDE.md §14).

## 2. Read data

Catalog and content reads belong in `src/server/storefront.ts` as cached functions:

```ts
export async function getThing(ctx: Ctx, id: string) {
  'use cache';
  cacheLife('hours'); // pick the shortest sensible life
  cacheTag(`store:${ctx.store}`, 'content'); // tags allow precise invalidation
  return call(storeApi(ctx).GET('/api/v1/store/…', { params: { path: { id } } }));
}
```

Never read cookies or headers inside a cached function, and never cache anything personal.
Personal data (cart, account) comes from the gateway in client components:
`fetch('/api/sf/cart', { headers: { 'x-sf-ctx': store.ctx } })` — mutations also send
`x-storefront: 1`.

### Customers

Sign-in, registration, sign-out and password change are Server Actions (`src/server/account-actions.ts`):
tokens go straight into the encrypted session cookie and never reach page scripts. Account pages
call `requireCustomer(ctx)` (`src/server/account.ts`), which sends visitors to sign in and back.
Customer accounts are per website: the gateway only sends the customer's token to stores of the
same website, and never stores a guest cart token for a signed-in customer.

## 3. Client components

`useStore()` gives the store, language, currency and prefix; `useHref()` builds links; `useI18n()`
translates. Avoid hooks that read the URL (`usePathname`, `useSearchParams`) in shared regions —
they make cached pages wait for the request; read `window.location` in event handlers instead.

## 4. Translate

Add keys to `src/i18n/en.ts` and every other language file; `npm test` fails when a language is
missing a key or a placeholder. Add a language: create `<lang>.ts` typed as `Messages` and register
it in `src/i18n/index.ts`.

## 5. Test

Put `*.test.ts` next to your code; `npm run check` runs them with the rest.
