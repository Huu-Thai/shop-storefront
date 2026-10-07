# Theming

Everything visual comes from **tokens**. Change tokens and theme config, not component classes —
light and dark modes, every page and the style guide follow. Rules: [STYLE-GUIDE.md](STYLE-GUIDE.md).

## 1. Brand — `src/theme/config.ts`

| Key                              | Effect                                                                   |
| -------------------------------- | ------------------------------------------------------------------------ |
| `name`, `monogram`               | Logo wordmark, page titles                                               |
| `presets`, `defaultPreset`       | Accent presets (must exist in `tokens.css`) and the one new visitors get |
| `defaultMode`                    | `light` (default), `dark` or `system`                                    |
| `announcement`                   | Show the bar above the header (text: `announce.text` in `src/i18n/*.ts`) |
| `menus.main`, `menus.footer`     | CMS menu codes (Shop Admin → Content → Menus)                            |
| `home.slider`, `home.heroBanner` | Slider code and banner placement used by the home page                   |
| `social`                         | Footer social links                                                      |

A live store keeps **one** accent colour: shoppers get no colour picker. Set `defaultPreset` for
your brand. The picker (and a short banner) appears only in demo mode (`DEMO_MODE=true`) and in the
style guide, so you can show buyers every preset.

Tagline and announcement text are translated UI strings (`brand.tagline`, `announce.text`).
Replace `src/app/icon.svg` with your icon and `src/components/shell/logo.tsx` with your logo.

## 2. Colours — `src/theme/tokens.css`

- `:root` holds the Ink scale, the accent scale, semantic, commerce and **region** tokens.
- `.dark` overrides semantic and region tokens only; `[data-theme='<preset>']` overrides the accent.
- Region examples:
  - light footer: `--footer-bg: var(--ink-50); --footer-fg: var(--ink-900); --footer-muted: var(--ink-500); --footer-border: var(--ink-200);`
  - accent announcement bar: `--announce-bg: var(--accent-400); --announce-fg: var(--ink-900); --announce-link: var(--ink-900);`

After any colour change run `npm test` — `src/theme/tokens.test.ts` checks every text/background
pair in both modes and every preset against WCAG AA.

### Add an accent preset

1. Copy the `cobalt` block in `tokens.css`, rename it, set `--accent-50 … --accent-900` (keep 400
   light enough for ink text, 700 dark enough for text on white).
2. Add `{ id, label, swatch }` to `presets` in `config.ts`.
3. `npm test`.

## 3. Shape

`--radius-button`, `--radius-control`, `--radius-card`, `--radius-media`: set them to `0`–`4px`
for a square, editorial look.

## 4. Typography

`src/app/fonts.ts` loads Inter (variable) with `next/font`. To use another family, change it there
and keep the CSS variable `--font-body`; for a separate heading family add a second font and point
`--font-display` (in `src/app/globals.css`) at it. Each extra family adds font files to the first
load — check Lighthouse afterwards.
