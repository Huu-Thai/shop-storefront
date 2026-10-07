import 'server-only';
import { z } from 'zod';

const STORE_CODE = /^[a-z][a-z0-9_-]{0,63}$/;

const schema = z.object({
  /** Origin of the shop API, e.g. https://api.shop.example (without /api/v1). */
  SHOP_API_URL: z.url({ protocol: /^https?$/ }),
  /** ≥ 32 characters; encrypts the customer session cookie (openssl rand -base64 48). */
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  /** Store served at the site root when no other store matches the request. */
  DEFAULT_STORE: z.string().regex(STORE_CODE, 'DEFAULT_STORE must be a store code like us-en'),
  /**
   * Extra stores to serve (comma-separated codes), e.g. stores of another website. The default
   * store's website's stores are always included.
   */
  STORES: z
    .string()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().regex(STORE_CODE, 'STORES must list store codes'))),
  /** Public origin for absolute URLs (canonical, sitemaps, Open Graph), e.g. https://shop.example. */
  SITE_URL: z.url({ protocol: /^https?$/ }).optional(),
  /**
   * Secret of the shop webhook that keeps caches fresh (Shop Admin → System → Webhooks, URL
   * <site>/api/revalidate). Without it the endpoint is off and caches expire on their own.
   */
  WEBHOOK_SECRET: z.string().min(16, 'WEBHOOK_SECRET must be at least 16 characters').optional(),
  /**
   * Demo mode (DEMO_MODE=true): shoppers can browse and fill a cart, but orders, registration and
   * account changes are refused (gateway and Server Actions), and the page shows a demo banner and
   * the accent switcher.
   */
  DEMO_MODE: z
    .enum(['true', 'false', '1', '0', ''])
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated server configuration; a misconfiguration names every problem. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success)
    throw new Error(
      `Invalid shop-storefront configuration:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    );
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.SHOP_API_URL.startsWith('https://'))
    console.warn('SHOP_API_URL is not https: customer tokens travel in clear text');
  cached = parsed.data;
  return cached;
}

/** Read-only demo (DEMO_MODE=true). */
export const isDemo = () => env().DEMO_MODE;

export const apiBase = () => `${env().SHOP_API_URL.replace(/\/+$/, '')}/api/v1`;
