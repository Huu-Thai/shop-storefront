/**
 * Token inventory for the live style guide and the contrast test — mirrors src/theme/tokens.css.
 * Swatches render `var(--token)`, so they follow the active mode and preset.
 */
export const inkScale = [
  '950',
  '900',
  '800',
  '700',
  '600',
  '500',
  '400',
  '300',
  '200',
  '100',
  '50',
] as const;
export const accentScale = ['50', '100', '300', '400', '700', '900'] as const;

export const semanticTokens = [
  { token: 'bg', role: 'Page background' },
  { token: 'surface', role: 'Cards, drawers, inputs, popovers' },
  { token: 'surface-muted', role: 'Section bands, filter panels' },
  { token: 'surface-sunken', role: 'Pressed and selected fills' },
  { token: 'fg', role: 'Primary text' },
  { token: 'fg-muted', role: 'Secondary text' },
  { token: 'fg-subtle', role: 'Placeholders, hints' },
  { token: 'border', role: 'Dividers, card outlines' },
  { token: 'border-strong', role: 'Input and control boundaries' },
  { token: 'primary', role: 'Primary buttons (add to cart, checkout)' },
  { token: 'accent', role: 'Highlights, “new”, active markers' },
  { token: 'accent-text', role: 'Accent-coloured text' },
  { token: 'ring', role: 'Focus ring' },
] as const;

export const commerceTokens = [
  { token: 'price', role: 'Current price' },
  { token: 'price-compare', role: 'Was-price (struck through)' },
  { token: 'sale', role: 'Sale price and sale badge' },
  { token: 'new', role: '“New” badge' },
  { token: 'stock-in', role: 'In stock' },
  { token: 'stock-low', role: 'Low stock' },
  { token: 'stock-out', role: 'Out of stock' },
  { token: 'media', role: 'Image well / empty image' },
] as const;

export const regionTokens = [
  { region: 'Announcement bar', bg: 'announce-bg', fg: 'announce-fg' },
  { region: 'Header', bg: 'header-bg', fg: 'header-fg' },
  { region: 'Hero', bg: 'hero-bg', fg: 'hero-fg' },
  { region: 'Footer', bg: 'footer-bg', fg: 'footer-fg' },
] as const;

export const statusTokens = ['success', 'warning', 'danger', 'info'] as const;

/** Text/background pairs that must meet WCAG AA (min ratio); checked by src/theme/tokens.test.ts. */
export const contrastPairs: { fg: string; bg: string; min: number; use: string }[] = [
  { fg: 'fg', bg: 'bg', min: 4.5, use: 'Body text on the page' },
  { fg: 'fg-muted', bg: 'bg', min: 4.5, use: 'Secondary text' },
  { fg: 'fg-muted', bg: 'surface-muted', min: 4.5, use: 'Secondary text on section bands' },
  { fg: 'fg-subtle', bg: 'surface', min: 4.5, use: 'Hints, placeholders' },
  { fg: 'fg-subtle', bg: 'surface-muted', min: 4.5, use: 'Hints on bands' },
  { fg: 'primary-fg', bg: 'primary', min: 4.5, use: 'Primary button' },
  { fg: 'accent-fg', bg: 'accent', min: 4.5, use: 'Accent button' },
  { fg: 'accent-text', bg: 'surface', min: 4.5, use: 'Accent text' },
  { fg: 'price-compare', bg: 'surface', min: 4.5, use: 'Was-price' },
  { fg: 'sale', bg: 'surface', min: 4.5, use: 'Sale price' },
  { fg: 'sale-fg', bg: 'sale', min: 4.5, use: 'Sale badge' },
  { fg: 'new-fg', bg: 'new', min: 4.5, use: '“New” badge' },
  { fg: 'stock-in', bg: 'surface', min: 4.5, use: 'In stock' },
  { fg: 'stock-low', bg: 'surface', min: 4.5, use: 'Low stock' },
  { fg: 'stock-out', bg: 'surface', min: 4.5, use: 'Out of stock' },
  { fg: 'media-fg', bg: 'media', min: 4.5, use: 'Empty-image label' },
  { fg: 'announce-fg', bg: 'announce-bg', min: 4.5, use: 'Announcement bar' },
  { fg: 'announce-link', bg: 'announce-bg', min: 4.5, use: 'Announcement link' },
  { fg: 'header-fg', bg: 'header-bg', min: 4.5, use: 'Header links' },
  { fg: 'hero-fg', bg: 'hero-bg', min: 4.5, use: 'Hero title' },
  { fg: 'hero-muted', bg: 'hero-bg', min: 4.5, use: 'Hero copy' },
  { fg: 'footer-fg', bg: 'footer-bg', min: 4.5, use: 'Footer headings' },
  { fg: 'footer-muted', bg: 'footer-bg', min: 4.5, use: 'Footer links' },
  { fg: 'border-strong', bg: 'surface', min: 3, use: 'Control boundaries (non-text)' },
  { fg: 'success-fg', bg: 'success-soft', min: 4.5, use: 'Success notice' },
  { fg: 'warning-fg', bg: 'warning-soft', min: 4.5, use: 'Warning notice' },
  { fg: 'danger-fg', bg: 'danger-soft', min: 4.5, use: 'Error notice' },
  { fg: 'info-fg', bg: 'info-soft', min: 4.5, use: 'Info notice' },
];

/** Fluid type: sizes in px at 360 px and at 1440 px wide (docs/STYLE-GUIDE.md §3). */
export const typeScale = [
  { name: 'display', min: 40, max: 72, line: 1.05, weight: 600, use: 'Hero headline' },
  { name: 'h1', min: 30, max: 48, line: 1.1, weight: 600, use: 'Page title' },
  { name: 'h2', min: 24, max: 36, line: 1.15, weight: 600, use: 'Section title' },
  { name: 'h3', min: 20, max: 24, line: 1.3, weight: 600, use: 'Sub-section, drawer title' },
  { name: 'h4', min: 17, max: 18, line: 1.4, weight: 600, use: 'Card group, footer heading' },
  { name: 'body-lg', min: 17, max: 18, line: 1.6, weight: 400, use: 'Lead, product description' },
  { name: 'body', min: 16, max: 16, line: 1.5, weight: 400, use: 'Default text' },
  { name: 'small', min: 14, max: 14, line: 1.45, weight: 400, use: 'Product card name, meta' },
  { name: 'caption', min: 12, max: 12, line: 1.35, weight: 500, use: 'Badges, helper text' },
  {
    name: 'overline',
    min: 12,
    max: 12,
    line: 1.35,
    weight: 600,
    use: 'Eyebrows (caps, +8% tracking)',
  },
] as const;

export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] as const;
export const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export const shapeTokens = [
  'radius-control',
  'radius-button',
  'radius-card',
  'radius-media',
] as const;
export const shadows = ['xs', 'sm', 'md', 'lg'] as const;
