'use client';

import { MapPin, Package, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { AddressForm } from '@/components/checkout/address-form';
import { Link } from '@/components/intent-link';
import { useHref, useStore } from '@/components/store/store-context';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/client';
import {
  type AddressInput,
  addressProblems,
  cleanAddress,
  fieldsFromApiError,
} from '@/lib/address';
import { GatewayError, sf } from '@/lib/cart-client';
import { cn } from '@/lib/cn';
import { changePassword } from '@/server/account-actions';
import type { components } from '@/server/shop-api';

type S = components['schemas'];
type Profile = S['ProfileDto'];
type OrderList = S['OrderListDto'];
type Address = S['AddressDto'];
type Loyalty = S['StorefrontLoyaltyDto'];

/** The shop ended the session (the gateway already cleared it): sign in and come back here. */
function signInAgain(router: ReturnType<typeof useRouter>) {
  const { pathname, search } = window.location;
  const prefix = pathname.replace(/\/account(\/.*)?$/, '');
  router.replace(`${prefix}/account/sign-in?next=${encodeURIComponent(pathname + search)}`);
}

/** Loads one gateway resource for the signed-in customer (undefined = 404 / none). */
function useResource<T>(path: string | null) {
  const store = useStore();
  const router = useRouter();
  const [data, setData] = useState<T | null | undefined>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!path) return;
    try {
      setData(await sf<T>(store.ctx, path));
      setError(null);
    } catch (e) {
      if (e instanceof GatewayError && e.status === 404) setData(undefined);
      else if (e instanceof GatewayError && e.status === 401) signInAgain(router);
      else setError(e instanceof GatewayError ? e.message : 'Network error');
    }
  }, [path, router, store.ctx]);
  useEffect(() => {
    if (!path) return;
    let live = true;
    sf<T>(store.ctx, path)
      .then((d) => {
        if (!live) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (!live) return;
        if (e instanceof GatewayError && e.status === 404) setData(undefined);
        else if (e instanceof GatewayError && e.status === 401) signInAgain(router);
        else setError(e instanceof GatewayError ? e.message : 'Network error');
      });
    return () => {
      live = false;
    };
  }, [path, router, store.ctx]);
  return { data, error, reload, setData };
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-6 text-h2">{children}</h1>;
}

const date = (locale: string, iso: string, style: 'long' | 'medium' = 'medium') =>
  new Intl.DateTimeFormat(locale, { dateStyle: style }).format(new Date(iso));

function statusTone(status: string) {
  return status === 'CANCELED'
    ? 'danger'
    : status === 'PENDING_PAYMENT'
      ? 'warning'
      : status === 'COMPLETE'
        ? 'neutral'
        : 'success';
}

function OrderRows({ orders }: { orders: OrderList['data'] }) {
  const { t, locale } = useI18n();
  const to = useHref();
  return (
    <ul className="grid divide-y divide-border rounded-card border border-border">
      {orders.map((o) => (
        <li
          key={o.id}
          className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 p-4 sm:p-5"
        >
          <div className="grid gap-1">
            <Link
              href={to(`/account/orders/${encodeURIComponent(o.number)}`)}
              className="focus-ring rounded-xs font-semibold after:absolute after:inset-0 hover:underline"
            >
              {t('account.order', { number: o.number })}
            </Link>
            <p className="text-small text-fg-muted">
              {date(locale, o.placedAt)} · {t('account.items', { n: o.itemCount })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={statusTone(o.status)}>
              {t(`order.status.${o.status}` as 'order.status.PROCESSING')}
            </Badge>
            <span className="tabular font-semibold">{o.grandTotal.formatted}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Package;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-card bg-surface-muted px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface">
        <Icon aria-hidden className="size-6" strokeWidth={1.5} />
      </span>
      <h2 className="text-h4">{title}</h2>
      <p className="max-w-sm text-small text-fg-muted">{body}</p>
      {action}
    </div>
  );
}

/** Overview: greeting, recent orders, points, default address. */
export function AccountOverview() {
  const { t, locale } = useI18n();
  const to = useHref();
  const profile = useResource<Profile>('account');
  const orders = useResource<OrderList>('orders?limit=3&page=1');
  const loyalty = useResource<Loyalty>('account/loyalty');
  const addresses = useResource<Address[]>('account/addresses');
  if (profile.data === null) return <Skeleton className="h-64 rounded-card" />;
  const p = profile.data;
  const def = addresses.data?.find((a) => a.isDefaultShipping) ?? addresses.data?.[0];
  return (
    <div className="grid gap-10">
      <div className="grid gap-1">
        <h1 className="text-h2">{t('account.hello', { name: p?.firstName ?? '' })}</h1>
        {p && (
          <p className="text-fg-muted">
            {p.email} · {t('account.memberSince', { date: date(locale, p.createdAt, 'long') })}
          </p>
        )}
      </div>
      <section aria-labelledby="ov-orders" className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 id="ov-orders" className="text-h4">
            {t('account.recentOrders')}
          </h2>
          {!!orders.data?.total && (
            <Link
              href={to('/account/orders')}
              className="focus-ring rounded-xs text-small font-semibold underline underline-offset-4"
            >
              {t('account.viewAll')}
            </Link>
          )}
        </div>
        {orders.data === null ? (
          <Skeleton className="h-32 rounded-card" />
        ) : orders.data?.data.length ? (
          <OrderRows orders={orders.data.data} />
        ) : (
          <Empty
            icon={Package}
            title={t('account.noOrders')}
            body={t('account.noOrdersBody')}
            action={
              <Link
                href={to('/')}
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-2')}
              >
                {t('cart.continue')}
              </Link>
            }
          />
        )}
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby="ov-points"
          className="grid content-start gap-2 rounded-card bg-surface-muted p-6"
        >
          <h2 id="ov-points" className="text-small font-semibold text-fg-muted">
            {t('account.pointsBalance')}
          </h2>
          {loyalty.data ? (
            <>
              <p className="tabular text-h2">{loyalty.data.balance.toLocaleString(locale)}</p>
              <p className="text-small text-fg-muted">
                {t('account.pointsWorth', { value: loyalty.data.balanceValue })}
              </p>
            </>
          ) : (
            <p className="text-small text-fg-muted">
              {loyalty.data === null ? '…' : t('account.noProgram')}
            </p>
          )}
          <Link
            href={to('/account/points')}
            className="focus-ring mt-2 justify-self-start rounded-xs text-small font-semibold underline underline-offset-4"
          >
            {t('account.points')}
          </Link>
        </section>
        <section
          aria-labelledby="ov-address"
          className="grid content-start gap-2 rounded-card bg-surface-muted p-6"
        >
          <h2 id="ov-address" className="text-small font-semibold text-fg-muted">
            {t('account.defaultShipping')}
          </h2>
          {def ? (
            <p className="text-small">
              {[`${def.firstName} ${def.lastName}`, def.line1, def.city, def.countryCode]
                .filter(Boolean)
                .join(', ')}
            </p>
          ) : (
            <p className="text-small text-fg-muted">
              {addresses.data === null ? '…' : t('account.noAddresses')}
            </p>
          )}
          <Link
            href={to('/account/addresses')}
            className="focus-ring mt-2 justify-self-start rounded-xs text-small font-semibold underline underline-offset-4"
          >
            {t('account.addresses')}
          </Link>
        </section>
      </div>
    </div>
  );
}

const PAGE = 10;

export function AccountOrders() {
  const { t } = useI18n();
  const to = useHref();
  const [page, setPage] = useState(1);
  const orders = useResource<OrderList>(`orders?limit=${PAGE}&page=${page}`);
  const pages = Math.max(1, Math.ceil((orders.data?.total ?? 0) / PAGE));
  return (
    <>
      <PageTitle>{t('account.orders')}</PageTitle>
      {orders.error && <Notice tone="danger" title={orders.error} />}
      {orders.data === null ? (
        <Skeleton className="h-64 rounded-card" />
      ) : orders.data?.data.length ? (
        <div className="grid gap-6">
          <OrderRows orders={orders.data.data} />
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('pager.previous')}
              </Button>
              <span className="tabular px-3 text-small text-fg-muted">
                {t('pager.page', { n: page })} / {pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('pager.next')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Empty
          icon={Package}
          title={t('account.noOrders')}
          body={t('account.noOrdersBody')}
          action={
            <Link
              href={to('/')}
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-2')}
            >
              {t('cart.continue')}
            </Link>
          }
        />
      )}
    </>
  );
}

const toInput = (a: Address): Partial<AddressInput> =>
  Object.fromEntries(
    Object.entries(a).filter(
      ([k, v]) => v !== null && !['id', 'isDefaultShipping', 'isDefaultBilling'].includes(k),
    ),
  ) as Partial<AddressInput>;

/** Address book: add, edit, delete, defaults. Uses the same form as checkout. */
export function AddressBook({ storeCountry }: { storeCountry: string }) {
  const { t } = useI18n();
  const store = useStore();
  const list = useResource<Address[]>('account/addresses');
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [value, setValue] = useState<Partial<AddressInput>>({});
  const [defaults, setDefaults] = useState({ shipping: false, billing: false });
  const [tried, setTried] = useState(false);
  const [apiFields, setApiFields] = useState<(keyof AddressInput)[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const open = (a: Address | 'new') => {
    setEditing(a);
    setValue(a === 'new' ? { countryCode: storeCountry } : toInput(a));
    setDefaults(
      a === 'new'
        ? { shipping: !list.data?.length, billing: !list.data?.length }
        : { shipping: a.isDefaultShipping, billing: a.isDefaultBilling },
    );
    setTried(false);
    setApiFields([]);
    setError(null);
  };
  const problems = addressProblems(value);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (problems.length) return document.getElementById(`ab-${problems[0]}`)?.focus();
    setBusy(true);
    try {
      const body = JSON.stringify({
        ...cleanAddress(value),
        isDefaultShipping: defaults.shipping,
        isDefaultBilling: defaults.billing,
      });
      if (editing === 'new') await sf(store.ctx, 'account/addresses', { method: 'POST', body });
      else if (editing)
        await sf(store.ctx, `account/addresses/${editing.id}`, { method: 'PATCH', body });
      setEditing(null);
      await list.reload();
    } catch (err) {
      const message = err instanceof GatewayError ? err.message : t('auth.error');
      const fields = fieldsFromApiError(message.replace(/^(\w+) /, 'shipping.$1 '));
      setApiFields(fields.shipping);
      setError(fields.shipping.length ? t('checkout.checkFields') : message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    setBusy(true);
    try {
      await sf(store.ctx, `account/addresses/${id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      await list.reload();
    } catch (err) {
      setError(err instanceof GatewayError ? err.message : t('auth.error'));
    } finally {
      setBusy(false);
    }
  };

  if (editing)
    return (
      <>
        <PageTitle>
          {editing === 'new' ? t('account.addAddress') : t('account.editAddress')}
        </PageTitle>
        <form onSubmit={save} className="grid max-w-2xl gap-6" noValidate>
          {error && <Notice tone="danger" title={error} />}
          <AddressForm
            id="ab"
            section="shipping"
            value={value}
            onChange={setValue}
            errors={[...(tried ? problems : []), ...apiFields]}
            storeCountry={storeCountry}
          />
          <div className="grid gap-1">
            {(['shipping', 'billing'] as const).map((k) => (
              <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 text-small">
                <input
                  type="checkbox"
                  checked={defaults[k]}
                  onChange={(e) => setDefaults((d) => ({ ...d, [k]: e.target.checked }))}
                  className="size-4 accent-[var(--primary)]"
                />
                {k === 'shipping'
                  ? t('account.makeDefaultShipping')
                  : t('account.makeDefaultBilling')}
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={busy}>
              {t('account.save')}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('account.cancel')}
            </Button>
          </div>
        </form>
      </>
    );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h2">{t('account.addresses')}</h1>
        {!!list.data?.length && (
          <Button variant="secondary" onClick={() => open('new')}>
            <Plus aria-hidden /> {t('account.addAddress')}
          </Button>
        )}
      </div>
      {error && <Notice tone="danger" title={error} className="mb-4" />}
      {list.data === null ? (
        <Skeleton className="h-40 rounded-card" />
      ) : list.data?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.data.map((a) => (
            <li
              key={a.id}
              className="grid content-between gap-4 rounded-card border border-border p-5"
            >
              <div className="grid gap-1 text-small">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  {a.isDefaultShipping && <Badge tone="new">{t('account.defaultShipping')}</Badge>}
                  {a.isDefaultBilling && <Badge>{t('account.defaultBilling')}</Badge>}
                </div>
                <p className="font-semibold">
                  {a.firstName} {a.lastName}
                </p>
                {a.company && <p className="text-fg-muted">{a.company}</p>}
                <p className="text-fg-muted">{[a.line1, a.line2].filter(Boolean).join(', ')}</p>
                <p className="text-fg-muted">
                  {[a.postcode, a.city, a.regionCode, a.countryCode].filter(Boolean).join(' ')}
                </p>
                {a.phone && <p className="text-fg-muted">{a.phone}</p>}
              </div>
              {confirmDelete === a.id ? (
                <div className="flex flex-wrap items-center gap-2 text-small">
                  <span>{t('account.deleteConfirm')}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy}
                    onClick={() => void remove(a.id)}
                  >
                    {t('account.delete')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                    {t('account.cancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => open(a)}>
                    <Pencil aria-hidden /> {t('checkout.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(a.id)}
                    aria-label={`${t('account.deleteAddress')}: ${a.line1}`}
                  >
                    <Trash2 aria-hidden /> {t('account.delete')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          icon={MapPin}
          title={t('account.noAddresses')}
          body={t('account.noAddressesBody')}
          action={
            <Button size="sm" className="mt-2" onClick={() => open('new')}>
              <Plus aria-hidden /> {t('account.addAddress')}
            </Button>
          }
        />
      )}
    </>
  );
}

/** Profile details and password. */
export function ProfileSettings() {
  const { t } = useI18n();
  const store = useStore();
  const profile = useResource<Profile>('account');
  const [saved, setSaved] = useState<'profile' | 'password' | null>(null);
  const [error, setError] = useState<{ form: 'profile' | 'password'; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState<'profile' | 'password' | null>(null);
  const [pwFields, setPwFields] = useState<{ current?: string; next?: string }>({});

  if (profile.data === null) return <Skeleton className="h-80 rounded-card" />;
  const p = profile.data;
  if (!p) return <Notice tone="danger" title={t('auth.error')} />;

  const saveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy('profile');
    setError(null);
    setSaved(null);
    try {
      profile.setData(
        await sf<Profile>(store.ctx, 'account', {
          method: 'PATCH',
          body: JSON.stringify({
            firstName: String(fd.get('firstName') ?? '').trim(),
            lastName: String(fd.get('lastName') ?? '').trim(),
            phone: String(fd.get('phone') ?? '').trim() || undefined,
            localeCode: String(fd.get('localeCode') ?? '') || undefined,
            acceptsMarketing: fd.get('acceptsMarketing') === 'on',
          }),
        }),
      );
      setSaved('profile');
    } catch (err) {
      setError({
        form: 'profile',
        message: err instanceof GatewayError ? err.message : t('auth.error'),
      });
    } finally {
      setBusy(null);
    }
  };
  const savePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('ctx', store.ctx);
    setSaved(null);
    setError(null);
    setBusy('password');
    // A Server Action: the shop ends every session on a password change, so the action signs the
    // customer back in with the new password.
    const result = await changePassword(fd).catch(() => ({ error: t('auth.error') }) as const);
    setBusy(null);
    setPwFields('fields' in result && result.fields ? result.fields : {});
    if ('error' in result && result.error)
      return setError({ form: 'password', message: result.error });
    if ('ok' in result && result.ok) {
      form.reset();
      setSaved('password');
    }
  };

  return (
    <>
      <PageTitle>{t('account.profile')}</PageTitle>
      <div className="grid gap-8">
        <form
          onSubmit={saveProfile}
          className="grid max-w-2xl gap-5 rounded-card border border-border p-6"
          key={p.id}
        >
          <h2 className="text-h4">{t('account.details')}</h2>
          {error?.form === 'profile' && <Notice tone="danger" title={error.message} />}
          {saved === 'profile' && <Notice tone="success" title={t('account.saved')} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="pf-first" label={t('auth.firstName')} required>
              <Input
                id="pf-first"
                name="firstName"
                autoComplete="given-name"
                defaultValue={p.firstName}
                required
              />
            </Field>
            <Field id="pf-last" label={t('auth.lastName')} required>
              <Input
                id="pf-last"
                name="lastName"
                autoComplete="family-name"
                defaultValue={p.lastName}
                required
              />
            </Field>
          </div>
          <Field id="pf-email" label={t('auth.email')}>
            <Input id="pf-email" value={p.email} readOnly disabled />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="pf-phone" label={t('account.phone')}>
              <Input
                id="pf-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={p.phone ?? ''}
              />
            </Field>
            <Field id="pf-locale" label={t('account.language')}>
              <Select id="pf-locale" name="localeCode" defaultValue={p.localeCode ?? store.locale}>
                {store.locales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-small">
            <input
              type="checkbox"
              name="acceptsMarketing"
              defaultChecked={p.acceptsMarketing}
              className="size-4 accent-[var(--primary)]"
            />
            {t('account.marketing')}
          </label>
          <Button type="submit" loading={busy === 'profile'} className="justify-self-start">
            {t('account.save')}
          </Button>
        </form>

        <form
          onSubmit={savePassword}
          className="grid max-w-2xl gap-5 rounded-card border border-border p-6"
          noValidate
        >
          <h2 className="text-h4">{t('account.passwordTitle')}</h2>
          {error?.form === 'password' && <Notice tone="danger" title={error.message} />}
          {saved === 'password' && <Notice tone="success" title={t('account.passwordChanged')} />}
          <Field
            id="pw-current"
            label={t('account.currentPassword')}
            required
            error={pwFields.current}
          >
            <Input
              id="pw-current"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!pwFields.current || undefined}
              aria-describedby={pwFields.current ? 'pw-current-error' : undefined}
            />
          </Field>
          <Field
            id="pw-new"
            label={t('account.newPassword')}
            required
            hint={t('auth.passwordHint')}
            error={pwFields.next}
          >
            <Input
              id="pw-new"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!pwFields.next || undefined}
              aria-describedby={pwFields.next ? 'pw-new-error' : 'pw-new-hint'}
            />
          </Field>
          <Button type="submit" loading={busy === 'password'} className="justify-self-start">
            {t('account.passwordTitle')}
          </Button>
        </form>
      </div>
    </>
  );
}

/** Points: balance, value, tier progress, expiry, recent activity. */
export function LoyaltyView() {
  const { t, locale } = useI18n();
  const loyalty = useResource<Loyalty>('account/loyalty');
  if (loyalty.data === null) return <Skeleton className="h-64 rounded-card" />;
  const l = loyalty.data;
  if (!l)
    return (
      <>
        <PageTitle>{t('account.points')}</PageTitle>
        <Empty icon={Star} title={t('account.noProgram')} body="" />
      </>
    );
  return (
    <>
      <PageTitle>{t('account.points')}</PageTitle>
      <div className="grid gap-6">
        <section className="grid gap-4 rounded-card bg-hero-bg p-6 text-hero-fg sm:p-8">
          <p className="text-small text-hero-muted">{l.programName}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="tabular text-display">{l.balance.toLocaleString(locale)}</p>
              <p className="text-hero-muted">
                {t('account.pointsWorth', { value: l.balanceValue })}
              </p>
            </div>
            {l.tier && <Badge tone="new">{t('account.tier', { tier: l.tier.name })}</Badge>}
          </div>
          {l.nextTier && (
            <p className="text-small text-hero-muted">
              {t('account.nextTier', {
                points: l.nextTier.pointsNeeded.toLocaleString(locale),
                tier: l.nextTier.name,
              })}
            </p>
          )}
        </section>
        <p className="text-small text-fg-muted">
          {t('account.pointsEarn', { n: l.pointsPerUnit, currency: l.currencyCode })}
        </p>
        {l.expiringSoon > 0 && l.nextExpiryAt && (
          <Notice tone="warning">
            {t('account.expiring', { points: l.expiringSoon, date: date(locale, l.nextExpiryAt) })}
          </Notice>
        )}
        <section aria-labelledby="pts-recent" className="grid gap-3">
          <h2 id="pts-recent" className="text-h4">
            {t('account.recentPoints')}
          </h2>
          {l.recent.length ? (
            <ul className="grid divide-y divide-border rounded-card border border-border">
              {l.recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-4 p-4 text-small">
                  <span>
                    <span className="font-medium">
                      {String(r.type).replace(/_/g, ' ').toLowerCase()}
                    </span>
                    {r.orderRef && <span className="text-fg-muted"> · {r.orderRef}</span>}
                    <span className="block text-caption text-fg-muted">
                      {date(locale, r.createdAt)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'tabular font-semibold',
                      r.points < 0 ? 'text-fg-muted' : 'text-stock-in',
                    )}
                  >
                    {r.points > 0 ? '+' : ''}
                    {r.points.toLocaleString(locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small text-fg-muted">{t('account.noPoints')}</p>
          )}
        </section>
      </div>
    </>
  );
}
