import 'server-only';
import createClient from 'openapi-fetch';
import type { Ctx } from '@/lib/routing';
import { env } from './env';
import type { components, paths } from './shop-api';

export type Schemas = components['schemas'];

/** An error answered by the shop API (Nest error body), safe to show to the shopper. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: string[] = [],
    readonly requestId?: string,
  ) {
    super(message);
  }
}

export function toApiError(status: number, body: unknown, requestId?: string): ApiError {
  const b = (body ?? {}) as { message?: string | string[]; error?: string };
  const list = Array.isArray(b.message) ? b.message : [];
  const message =
    (typeof b.message === 'string' ? b.message : list[0]) ??
    b.error ??
    `The shop API answered ${status}`;
  return new ApiError(status, message, list, requestId);
}

/** Headers that select the store, language and currency of a request. */
export function ctxHeaders(ctx: Ctx): Record<string, string> {
  return { 'x-store': ctx.store, 'accept-language': ctx.locale, 'x-currency': ctx.currency };
}

/**
 * Typed client for the shop's storefront API (`/api/v1/store/*`) in one store / language /
 * currency. Server-side only. Anonymous: catalog and content are the same for every shopper, which
 * is what makes them cacheable (src/server/storefront.ts). Personal calls (cart, account) go
 * through the gateway with the shopper's cookies.
 */
export function storeApi(ctx: Ctx) {
  return createClient<paths>({
    baseUrl: env().SHOP_API_URL.replace(/\/+$/, ''),
    headers: ctxHeaders(ctx),
  });
}

/** Unwraps an openapi-fetch result: the data, null for 404, or an ApiError. */
export async function call<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T | null> {
  const { data, error, response } = await promise;
  if (response.status === 404) return null;
  if (!response.ok)
    throw toApiError(response.status, error, response.headers.get('x-request-id') ?? undefined);
  return data as T;
}
