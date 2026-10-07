import 'server-only';
import { env } from './env';

/**
 * Absolute URL for canonical links, Open Graph and structured data — only when SITE_URL is set
 * (search engines need absolute URLs; guessing the host from the request would make pages uncacheable).
 */
export function absoluteUrl(path: string): string | null {
  const site = env().SITE_URL;
  if (!site) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${site.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
