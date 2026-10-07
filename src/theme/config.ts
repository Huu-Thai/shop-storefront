/**
 * Branding and theme defaults — the first file a buyer edits (docs/THEMING.md). Colours live in
 * src/theme/tokens.css; presets listed here must exist there as `[data-theme='<id>']`.
 */
export const themeConfig = {
  name: 'Ink Store',
  /** Two letters in the logo mark (favicon-sized places). */
  monogram: 'IS',
  /** Tagline and announcement text are UI strings (src/i18n: brand.tagline, announce.text). */
  /** Accent presets; `lime` is the default palette in :root. */
  presets: [
    { id: 'lime', label: 'Lime', swatch: '#C3EB4D' },
    { id: 'cobalt', label: 'Cobalt', swatch: '#7D94FF' },
    { id: 'coral', label: 'Coral', swatch: '#FF9B7D' },
    { id: 'teal', label: 'Teal', swatch: '#4FD1BD' },
    { id: 'amber', label: 'Amber', swatch: '#FFC24B' },
    { id: 'violet', label: 'Violet', swatch: '#B69CFF' },
  ],
  defaultPreset: 'lime',
  /** 'light' | 'dark' | 'system' — storefronts are usually light-first. */
  defaultMode: 'light',
  /** Show the bar above the header (text: `announce.text`; a CMS block can replace it in Phase 4). */
  announcement: true,
  /** CMS menu codes (Shop Admin → Content → Menus). */
  menus: { main: 'main', footer: 'footer' },
  /** Slider and banner placements used by the home page. */
  home: { slider: 'home', heroBanner: 'home.hero', productRailLimit: 8 },
  social: [] as { label: string; url: string }[],
} as const;

export type PresetId = (typeof themeConfig.presets)[number]['id'];
export const PRESET_COOKIE = 'sf_preset';

export function isPreset(value: unknown): value is PresetId {
  return themeConfig.presets.some((p) => p.id === value);
}
