# Shop Storefront documentation

Shop Storefront is the customer-facing store for the **shop** headless commerce API. It ships as a
Next.js 16 app you run next to the API. Browsers talk only to the storefront, which calls the API
for them.

| I want to…                                   | Read                                             |
| -------------------------------------------- | ------------------------------------------------ |
| Install it and see my store                  | [Install & configure](INSTALL.md)                |
| Put it on a server (Docker or Node)          | [Deploy & upgrade](DEPLOY.md)                    |
| Fix something that doesn't work              | [Troubleshooting](TROUBLESHOOTING.md)            |
| Change colours, logo, fonts or accent preset | [Theming](THEMING.md)                            |
| Know the design rules for sizes and layouts  | [Style guide](STYLE-GUIDE.md) and `/style-guide` |
| Add a page, a section or a translation       | [Extending](EXTENDING.md)                        |
| Run the unit, browser and Lighthouse checks  | [Testing](TESTING.md)                            |
| Cut a release of a customised copy           | [Release checklist](RELEASE-CHECKLIST.md)        |

Also at the project root:

- `CHANGELOG.md`: what changed in each version.
- `LICENSE`: the Regular and Extended licence terms.
- `THIRD-PARTY-NOTICES.md`: the open-source packages bundled in the build.

## What you get

- **A complete store:** home, categories with filters and sorting, product pages with options,
  search with suggestions, cart, one-page checkout, order pages, customer accounts, blog and CMS
  pages, all driven by the shop API.
- **The Ink Store design system:** base `#191919` (shared with Shop Admin), six accent presets,
  light and dark modes, WCAG 2.2 AA contrast checked by unit tests and by axe in the browser suite.
- **Fast by default:** cached pages per store, language and currency, refreshed by shop webhooks;
  Lighthouse mobile performance 90+.
- **Found by search engines:** server-rendered HTML, clean URLs, canonical links, `hreflang`,
  structured data, sitemaps, `robots.txt`, real 404 and 301 statuses.
- **Several stores from one deployment:** each with its own languages and currencies, on its own
  host or path.
- **English and Vietnamese**, with a pattern for adding languages.
- **A demo mode** (`DEMO_MODE=true`) for showing the theme publicly.
- **A secure gateway:** the browser never sees API or customer tokens, and every change needs a
  same-origin request with the gateway header.

## Support

Before you contact support, check [Troubleshooting](TROUBLESHOOTING.md). Include in your message:

- the version from `package.json`
- the shop API version
- the exact message shown on screen or in the server log
