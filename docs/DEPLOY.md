# Deploy & upgrade

The theme builds to a self-contained Node.js server (Next.js `standalone` output). It keeps no
data of its own: carts, orders and customers live in the shop API, and customer sessions live in
an encrypted cookie. You can run any number of identical instances behind a load balancer.

## Option A: Docker

```bash
docker build -t shop-storefront .
docker run -p 3002:3002 \
  -e SHOP_API_URL=https://api.example.com \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  -e DEFAULT_STORE=us-en \
  -e SITE_URL=https://shop.example.com \
  shop-storefront
```

- The image runs as a non-root user and listens on `0.0.0.0:3002`. Its health check calls
  `/api/health`.
- The build needs no shop API: pages are rendered on first request.
- Image origins that aren't `https` are baked in at build time:
  `docker build --build-arg MEDIA_ORIGINS=http://minio.internal:9000 .`
- `docker-compose.example.yml` shows the storefront next to a shop API.

## Option B: Node.js

```bash
npm ci
npm run build
HOSTNAME=0.0.0.0 PORT=3002 npm start      # with the variables from INSTALL.md set
```

`npm run build` also copies the static files next to the server. To move the build, copy
`.next/standalone` as a whole.

## HTTPS and the reverse proxy

Terminate HTTPS in front of the theme (nginx, Caddy, a load balancer) and pass these headers:

```nginx
location / {
  proxy_pass http://127.0.0.1:3002;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

- The theme picks the store from the request's **host** and path, so keep the original `Host`.
- Forms and the cart API check the request's origin against its host: the host the browser used
  must reach the theme unchanged (or in `X-Forwarded-Host`).
- Cookies are `Secure` in production, so serve the site over HTTPS.

## Stores, languages and hosts

| URL                        | Store and language                                          |
| -------------------------- | ----------------------------------------------------------- |
| `shop.example.com/`        | `DEFAULT_STORE`, in its default language                    |
| `shop.example.com/vi-vn/…` | The same store in another language                          |
| `shop.example.com/vn-vi/…` | Another store (`/<store-code>`), when it has no `baseUrl`   |
| `vn.example.com/…`         | A store whose `baseUrl` in Shop Admin → Stores is this host |
| `example.com/vn/…`         | A store whose `baseUrl` is `https://example.com/vn`         |

Point every host at the same deployment. Customers belong to a **website**: stores of one website
share accounts, stores of different websites don't. Currency follows the shopper's choice (a
cookie), so one URL serves every currency of the store.

## Keep pages fresh

Pages are cached per store, language and currency. To show changes at once instead of when the
cache expires (minutes for prices and stock, hours for content):

1. In Shop Admin → System → Webhooks, add a webhook:
   - URL: `https://shop.example.com/api/revalidate`
   - events: the list in [README](../README.md#keeping-pages-fresh)
2. Copy its signing secret into `WEBHOOK_SECRET` and restart.

Edits then appear on the next visit; deleted or unpublished content disappears immediately. The
endpoint is off (404) until `WEBHOOK_SECRET` is set, and it rejects unsigned or stale calls. The
shop must be able to reach the storefront's public URL (or its private address, for a shop
that allows private webhook targets).

## A CDN in front

- Pages, `/sitemap.xml` and `robots.txt` are safe to cache for a short time (a minute), but then
  webhook updates are only as fresh as the CDN allows.
- Never cache `/api/*`, `/account/*`, `/cart`, `/checkout/*` or `/orders/*`: they carry the
  shopper's own cookies. Responses to them are marked `no-store`.
- `/_next/static/*` is fingerprinted; cache it for a year.
- Product images come straight from the shop's media URLs: set `MEDIA_PUBLIC_BASE_URL` in the
  shop API to put a CDN in front of them.

## Shop API checklist

| Needed                               | For                                                      |
| ------------------------------------ | -------------------------------------------------------- |
| Reachable from the theme's server    | Everything                                               |
| CORS                                 | Not needed: the browser never calls the API              |
| The worker process                   | Search indexing, URL rewrites and webhook delivery       |
| `MEDIA_PUBLIC_BASE_URL`              | Permanent image URLs instead of short-lived signed links |
| Payment methods and shipping methods | Checkout                                                 |
| Webhook to `/api/revalidate`         | Fresh pages (above)                                      |

## Upgrade

1. Read `CHANGELOG.md`: it lists breaking changes and the shop API version needed.
2. Compare your changes with the new release. Keep customisations in `src/theme`, `src/features`
   and your own routes (see [Extending](EXTENDING.md)) so upgrades stay small.
3. `npm ci && npm run check && npm run build`, then deploy. Sessions survive an upgrade as long
   as `SESSION_SECRET` is unchanged.
4. If the shop API changed, regenerate the types with `npm run api:types` and fix what the
   compiler shows.
