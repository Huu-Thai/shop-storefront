import type { NextConfig } from 'next';
import pkg from './package.json' with { type: 'json' };

const dev = process.env.NODE_ENV !== 'production';
/**
 * Extra image origins that aren't https — e.g. MinIO's signed links in development
 * (`http://localhost:9200`). Comma-separated; read at build time.
 */
const mediaOrigins = (process.env.MEDIA_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter((o) => /^https?:\/\/[\w.-]+(:\d+)?$/.test(o));

/**
 * Content Security Policy: same-origin scripts and API calls (the gateway), images from any https
 * origin (the shop's CDN / S3). Inline styles are needed by Radix positioning; the inline theme
 * script runs before paint to avoid a flash of the wrong colour mode.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  ["img-src 'self' data: blob: https:", ...mediaOrigins].join(' '),
  "font-src 'self' data:",
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
  // Video embeds in CMS content (the shop allows these players only).
  'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com',
  ["media-src 'self' https:", ...mediaOrigins].join(' '),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  ...(dev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
];

const nextConfig: NextConfig = {
  // Shown in the style guide; only the version string is inlined, not package.json.
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',
  // Catalog and content are cached per store / locale / currency ('use cache', PLAN.md §2).
  cacheComponents: true,
  // Product images come resized from the shop (renditions); no server-side image optimiser, so
  // sharp and its native libvips stay out of the build.
  images: { unoptimized: true },
  outputFileTracingExcludes: { '*': ['node_modules/sharp/**', 'node_modules/@img/**'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
