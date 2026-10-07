# Troubleshooting

## The server won't start

| You see                                      | Cause and fix                                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| _Invalid shop-storefront configuration_      | A required variable is missing or wrong. The message names it: `SHOP_API_URL`, `SESSION_SECRET` (32+ characters), `DEFAULT_STORE` |
| Port already in use                          | Another program uses 3002. Set `PORT`, or stop the other program                                                                  |
| Every page is a 500, "socket hang up" in log | The server listens on `127.0.0.1` only. Start it with `HOSTNAME=0.0.0.0` (the Docker image does)                                  |

## Pages are empty or wrong

| You see                                   | Cause and fix                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 500 everywhere, "The shop is unreachable" | The theme's server can't reach `SHOP_API_URL`. Test it from that machine: `curl $SHOP_API_URL/api/v1/store/config -H 'x-store: us-en'` |
| The home page has no slider or banners    | Create the slider `home` and the banner placement `home.hero` in Shop Admin → Content (codes are in `src/theme/config.ts`)             |
| The header has no menu                    | Create the menus `main` and `footer`, and publish their items                                                                          |
| A store 404s                              | Its code isn't served: it is neither `DEFAULT_STORE`, nor in the default store's website, nor listed in `STORES`                       |
| A product or category URL gives 404       | URLs come from the shop's URL rewrites. Rebuild them in Shop Admin (Content → URLs) and check the product is published in this store   |
| Prices show in the wrong currency         | The currency is the shopper's cookie choice, falling back to the store's default. Check the store's currencies in Shop Admin           |

## Stale pages

You changed something in Shop Admin and the storefront still shows the old version.

1. **Is the webhook set up?** Shop Admin → System → Webhooks should list a webhook to
   `https://<your site>/api/revalidate`. Without it, content refreshes within hours and prices
   within minutes. See [Deploy](DEPLOY.md#keep-pages-fresh).
2. **Does it deliver?** Open the webhook's deliveries in Shop Admin. `401` means the secret in
   `WEBHOOK_SECRET` differs from the webhook's; `404` means `WEBHOOK_SECRET` isn't set; a timeout
   means the shop can't reach your site.
3. **Is the event subscribed?** The list is in the [README](../README.md#keeping-pages-fresh).
4. **A CDN in front?** It may keep serving its own copy. Purge it, or shorten its cache for pages.

## Sitemaps and search engines

- `/sitemap.xml` lists no pages, or has `localhost` in it: set `SITE_URL` to the public origin.
- Pages aren't indexed: filtered, sorted, search, cart, account and order pages are `noindex` on
  purpose. Category and product pages are indexable.

## Images

| You see                                         | Cause and fix                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Images missing, "Content Security Policy" error | The image host isn't `https`. Set `MEDIA_ORIGINS` and **rebuild**: it is baked into the policy         |
| Images stop working after a while               | The shop signs image links that expire. Set `MEDIA_PUBLIC_BASE_URL` on the shop API for permanent URLs |
| A video in content doesn't play                 | Only YouTube and Vimeo embeds are allowed                                                              |

## Customers and checkout

| You see                                 | Cause and fix                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A customer is signed out after a deploy | `SESSION_SECRET` changed. Keep the same value across deploys                                                                                              |
| "Cross-site request refused"            | The request's origin doesn't match its host. Make the proxy pass `Host` or `X-Forwarded-Host` unchanged ([Deploy](DEPLOY.md#https-and-the-reverse-proxy)) |
| Sign-in works on one store, not another | Customers belong to a website. A customer of one website can't sign in on a store of another                                                              |
| Checkout shows no delivery options      | Add a shipping method for the country in Shop Admin, then re-enter the address                                                                            |
| "No payment methods are available"      | Enable a payment method for the store                                                                                                                     |
| A gift card can't be added to the cart  | Gift cards aren't sold online yet; the product page says so                                                                                               |
| No order e-mail arrives                 | The shop doesn't send e-mails yet; the order page is the confirmation                                                                                     |

## Demo mode

- Orders or registration are refused: that's the demo. Unset `DEMO_MODE` (or set it to `false`) and
  restart.
- The accent picker is missing: it only shows in demo mode and in the style guide (`/style-guide`).

## Appearance

- A colour looks wrong in dark mode: use the semantic tokens, never raw colours (see the
  [Style guide](STYLE-GUIDE.md)).
- The theme flashes the wrong colour on load: the inline theme script in the page head was removed
  or blocked by a custom Content Security Policy.

## Still stuck?

Collect the browser console, the server log and the request that failed, then contact support with
your licence details.
