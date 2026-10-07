# Install & configure

## Requirements

| What     | Version / notes                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| Node.js  | 22 or newer (`node -v`)                                                                                    |
| Shop API | The release this theme was built against (see `CHANGELOG.md`), reachable from the server running the theme |
| A store  | At least one website with a store, a language and a currency, created in Shop Admin                        |
| Browser  | Current Chrome, Edge, Firefox or Safari                                                                    |

The browser never calls the shop API directly. Only the storefront server needs to reach it, so
the API can stay on a private network.

## 1. Install

```bash
cd shop-storefront
npm ci
cp .env.example .env.local
```

## 2. Configure

Edit `.env.local` for development. In production, set these as environment variables.

| Variable         | Required | When read | Purpose                                                                                                                                                                                                    |
| ---------------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SHOP_API_URL`   | yes      | runtime   | Base URL of the shop API, without `/api/v1`. For example `http://shop-api:3000`. Used only on the server.                                                                                                  |
| `SESSION_SECRET` | yes      | runtime   | At least 32 characters. Encrypts the customer session cookie. Generate it with `openssl rand -base64 48`. Changing it signs every customer out.                                                            |
| `DEFAULT_STORE`  | yes      | runtime   | Code of the store served at the site root, for example `us-en` (Shop Admin → Stores).                                                                                                                      |
| `STORES`         | no       | runtime   | More store codes to serve, comma-separated. The stores of the default store's website are always served; list stores of **other** websites here.                                                           |
| `SITE_URL`       | no       | runtime   | The public origin, for example `https://shop.example.com`. Needed for the sitemaps, absolute canonical links and `hreflang`. Set it in production.                                                         |
| `WEBHOOK_SECRET` | no       | runtime   | Signing secret of the shop webhook that keeps pages fresh. See [Deploy](DEPLOY.md#keep-pages-fresh).                                                                                                       |
| `MEDIA_ORIGINS`  | no       | **build** | Image origins that aren't `https`, comma-separated. For example `http://localhost:9200` for MinIO in development. Added to the Content Security Policy, so rebuild after changing it. `https` images work. |
| `DEMO_MODE`      | no       | runtime   | `true` turns on the demo. See [Demo mode](#demo-mode).                                                                                                                                                     |
| `PORT`           | no       | runtime   | Port to listen on (`3002` in `npm run dev` and in the Docker image).                                                                                                                                       |
| `HOSTNAME`       | no       | runtime   | Interface to listen on. Use `0.0.0.0` (the Docker image does): the storefront calls itself on `localhost` for its internal routes.                                                                         |

The server checks these when it starts. If a required variable is missing or invalid, it stops
with _Invalid shop-storefront configuration_ and names the variable. In production it also warns
when `SHOP_API_URL` isn't `https`.

## 3. Run

```bash
npm run dev                     # development, http://localhost:3002
```

For production builds, see [Deploy & upgrade](DEPLOY.md).

## 4. What the shop needs

The storefront shows what Shop Admin holds. A fresh install looks empty until you add:

| Where in Shop Admin                          | Why                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------- |
| Stores (website, store, locales, currencies) | The store codes you set in `DEFAULT_STORE` and `STORES`             |
| Content → Menus: codes `main` and `footer`   | The header and footer links                                         |
| Content → Sliders: code `home`               | The home page slider                                                |
| Content → Banners: placement `home.hero`     | The home page banners                                               |
| Catalog                                      | Categories (the header lists the top ones), products, prices, stock |
| Payment and shipping methods                 | Without them checkout can't be completed                            |

Codes and placements are set in `src/theme/config.ts`. The shop sends no e-mails and has no
forgotten-password flow yet, so the theme doesn't promise either.

## Demo mode

`DEMO_MODE=true` is for showcase installs. Visitors can browse, search and fill a cart, but:

- orders, registration, password changes and every account change are refused, both from the
  browser and in the server code behind the forms;
- a banner says so, with a picker for the six accent colours.

The picker is only shown in demo mode and in the style guide: a live store keeps one brand colour.

## Brand it

See [Theming](THEMING.md) for the logo, colours, accent presets and type, and
[Extending](EXTENDING.md) for adding pages and features.
