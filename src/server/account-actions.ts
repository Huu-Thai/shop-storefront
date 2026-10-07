'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isEmail } from '@/lib/address';
import { passwordStrong, safeNext } from '@/lib/password';
import { SIGNED_IN_COOKIE } from '@/lib/preferences';
import { type Ctx, decodeCtx, href } from '@/lib/routing';
import { translator } from '@/i18n';
import { apiBase, env, isDemo } from './env';
import { cartCookie, cartCountCookie } from './gateway';
import { routingTable } from './routing-table';
import { clearSession, getSession, writeSession } from './session';
import { sessionFromTokens } from './session-crypto';
import { getPrefix } from './storefront';

export interface AuthState {
  error?: string;
  /** Field → message. */
  fields?: Record<string, string>;
  /** Values to keep in the form after an error (never the password). */
  values?: Record<string, string>;
}

/** The store a form was posted from (a hidden field), only if this deployment serves it. */
async function formCtx(fd: FormData): Promise<Ctx | null> {
  const ctx = decodeCtx(String(fd.get('ctx') ?? ''));
  if (!ctx) return null;
  const e = env();
  const table = await routingTable({
    apiBase: apiBase(),
    defaultStore: e.DEFAULT_STORE,
    extraStores: e.STORES,
  });
  const store = table.stores.find((s) => s.code === ctx.store);
  return store?.locales.includes(ctx.locale) ? ctx : null;
}

const call = (ctx: Ctx, path: string, init: RequestInit & { bearer?: string } = {}) =>
  fetch(`${apiBase()}/store/${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-store': ctx.store,
      'accept-language': ctx.locale,
      'x-currency': ctx.currency,
      ...(init.bearer ? { authorization: `Bearer ${init.bearer}` } : {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

/**
 * Stores the customer's tokens in the encrypted session cookie and brings the guest cart along:
 * its lines merge into the customer's cart, then the guest token is forgotten.
 */
async function establish(ctx: Ctx, tokens: Parameters<typeof sessionFromTokens>[0]) {
  const session = sessionFromTokens(tokens, ctx.store);
  await writeSession(session);
  const jar = await cookies();
  const secure = env().NODE_ENV === 'production';
  const maxAge = Math.max(60, Math.floor((session.refreshExpiresAt - Date.now()) / 1000));
  jar.set(SIGNED_IN_COOKIE, '1', { path: '/', sameSite: 'lax', secure, maxAge });
  const guest = jar.get(cartCookie(ctx.store))?.value;
  const res = guest
    ? await call(ctx, 'cart/merge', {
        method: 'POST',
        body: JSON.stringify({ token: guest }),
        bearer: session.accessToken,
      }).catch(() => null)
    : await call(ctx, 'cart', { bearer: session.accessToken }).catch(() => null);
  jar.delete(cartCookie(ctx.store));
  const cart = res?.ok ? ((await res.json()) as { itemCount?: number }) : null;
  if (cart && typeof cart.itemCount === 'number')
    jar.set(cartCountCookie(ctx.store), String(cart.itemCount), {
      path: '/',
      sameSite: 'lax',
      secure,
      maxAge: 60 * 60 * 24 * 30,
    });
  else jar.delete(cartCountCookie(ctx.store));
}

async function apiMessage(res: Response): Promise<string | undefined> {
  const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  return Array.isArray(body.message) ? body.message[0] : body.message;
}

export async function signIn(_prev: AuthState | null, fd: FormData): Promise<AuthState> {
  const ctx = await formCtx(fd);
  if (!ctx) return { error: 'Unknown store' };
  const t = translator(ctx.locale);
  const email = String(fd.get('email') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  const values = { email };
  if (!isEmail(email)) return { fields: { email: t('auth.invalidEmail') }, values };
  if (!password) return { fields: { password: t('auth.required') }, values };
  const res = await call(ctx, 'account/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }).catch(() => null);
  if (!res) return { error: t('auth.error'), values };
  if (res.status === 401 || res.status === 400) return { error: t('auth.invalid'), values };
  if (res.status === 429) return { error: t('auth.tooMany'), values };
  if (!res.ok) return { error: t('auth.error'), values };
  await establish(ctx, await res.json());
  const prefix = await getPrefix(ctx);
  redirect(safeNext(fd.get('next'), href('/account', prefix)));
}

export async function register(_prev: AuthState | null, fd: FormData): Promise<AuthState> {
  const ctx = await formCtx(fd);
  if (!ctx) return { error: 'Unknown store' };
  const t = translator(ctx.locale);
  if (isDemo()) return { error: t('demo.refused') };
  const values = {
    email: String(fd.get('email') ?? '').trim(),
    firstName: String(fd.get('firstName') ?? '').trim(),
    lastName: String(fd.get('lastName') ?? '').trim(),
  };
  const password = String(fd.get('password') ?? '');
  const fields: Record<string, string> = {};
  if (!values.firstName) fields.firstName = t('auth.required');
  if (!values.lastName) fields.lastName = t('auth.required');
  if (!isEmail(values.email)) fields.email = t('auth.invalidEmail');
  if (!passwordStrong(password)) fields.password = t('auth.weakPassword');
  if (Object.keys(fields).length) return { fields, values };
  const res = await call(ctx, 'account/register', {
    method: 'POST',
    body: JSON.stringify({
      ...values,
      password,
      acceptsMarketing: fd.get('acceptsMarketing') === 'on',
    }),
  }).catch(() => null);
  if (!res) return { error: t('auth.error'), values };
  if (res.status === 429) return { error: t('auth.tooMany'), values };
  // The shop explains refusals (e.g. an e-mail already registered) in its own words.
  if (!res.ok) return { error: (await apiMessage(res)) ?? t('auth.error'), values };
  await establish(ctx, await res.json());
  const prefix = await getPrefix(ctx);
  redirect(safeNext(fd.get('next'), href('/account', prefix)));
}

export async function signOut(fd: FormData): Promise<void> {
  const ctx = await formCtx(fd);
  const session = await getSession();
  if (ctx && session)
    await call(ctx, 'account/logout', {
      method: 'POST',
      body: JSON.stringify({ everywhere: fd.get('everywhere') === '1' }),
      bearer: session.accessToken,
    }).catch(() => null);
  await clearSession();
  const jar = await cookies();
  jar.delete(SIGNED_IN_COOKIE);
  if (ctx) {
    // The customer's cart stays with their account; this device starts empty.
    jar.delete(cartCookie(ctx.store));
    jar.delete(cartCountCookie(ctx.store));
  }
  redirect(ctx ? href('/', await getPrefix(ctx)) : '/');
}

export interface PasswordResult {
  ok?: boolean;
  error?: string;
  fields?: { current?: string; next?: string };
}

/**
 * Changes the password. The shop ends every session of the account when the password changes, so
 * the customer is signed straight back in with the new password (a fresh session on this device).
 */
export async function changePassword(fd: FormData): Promise<PasswordResult> {
  const ctx = await formCtx(fd);
  const session = await getSession();
  if (!ctx || !session) return { error: 'Not signed in' };
  const t = translator(ctx.locale);
  if (isDemo()) return { error: t('demo.refused') };
  const currentPassword = String(fd.get('currentPassword') ?? '');
  const newPassword = String(fd.get('newPassword') ?? '');
  const fields = {
    current: currentPassword ? undefined : t('auth.required'),
    next: passwordStrong(newPassword) ? undefined : t('auth.weakPassword'),
  };
  if (fields.current || fields.next) return { fields };
  const profile = await call(ctx, 'account', { bearer: session.accessToken }).catch(() => null);
  if (!profile?.ok) return { error: t('auth.error') };
  const { email } = (await profile.json()) as { email: string };
  const res = await call(ctx, 'account/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    bearer: session.accessToken,
  }).catch(() => null);
  if (!res) return { error: t('auth.error') };
  if (res.status === 400 || res.status === 401 || res.status === 403)
    return { fields: { current: t('account.wrongPassword') } };
  if (res.status === 429) return { error: t('auth.tooMany') };
  if (!res.ok) return { error: (await apiMessage(res)) ?? t('auth.error') };
  const login = await call(ctx, 'account/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: newPassword }),
  }).catch(() => null);
  if (login?.ok) await establish(ctx, await login.json());
  else {
    await clearSession();
    (await cookies()).delete(SIGNED_IN_COOKIE);
  }
  return { ok: true };
}
