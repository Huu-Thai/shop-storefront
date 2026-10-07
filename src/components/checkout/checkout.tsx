'use client';

import { Check, ChevronDown, Lock, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { type Cart, useCart } from '@/components/cart/cart-context';
import { CartLines, CartTotals, CouponForm } from '@/components/cart/cart-parts';
import { Link } from '@/components/intent-link';
import { useHref, useStore } from '@/components/store/store-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n/client';
import {
  type AddressField,
  type AddressInput,
  addressProblems,
  cleanAddress,
  fieldsFromApiError,
  isEmail,
} from '@/lib/address';
import { GatewayError, sf } from '@/lib/cart-client';
import {
  idempotencyKey,
  type Order,
  type PaymentMethod,
  startPayment,
} from '@/lib/checkout-client';
import { cn } from '@/lib/cn';
import { SIGNED_IN_COOKIE } from '@/lib/preferences';
import { AddressForm } from './address-form';

type Step = 'contact' | 'address' | 'delivery' | 'payment';
type ShippingOption = {
  code: string;
  name: string;
  description?: string | null;
  carrier?: string | null;
  price: { amount: number; formatted: string };
};

type SavedAddress = AddressInput & { id: string; isDefaultShipping: boolean };
const savedToInput = (a: SavedAddress): Partial<AddressInput> =>
  Object.fromEntries(
    Object.entries(a).filter(
      ([k, v]) => v !== null && !['id', 'isDefaultShipping', 'isDefaultBilling'].includes(k),
    ),
  ) as Partial<AddressInput>;

const toInput = (a: Cart['shippingAddress'] | null | undefined): Partial<AddressInput> =>
  a
    ? (Object.fromEntries(
        Object.entries(a).filter(([, v]) => v !== null && v !== undefined),
      ) as Partial<AddressInput>)
    : {};

function Section({
  n,
  title,
  done,
  open,
  summary,
  onEdit,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  open: boolean;
  summary?: ReactNode;
  onEdit?: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section aria-labelledby={`step-${n}`} className="rounded-card bg-surface p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 id={`step-${n}`} className="flex items-center gap-3 text-h4">
          <span
            aria-hidden
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
              done && !open
                ? 'bg-primary text-primary-fg'
                : 'border border-border-strong text-fg-muted',
              open && 'border-primary bg-surface text-fg',
            )}
          >
            {done && !open ? <Check className="size-4" strokeWidth={3} /> : n}
          </span>
          <span className="sr-only">{t('checkout.step', { n })}: </span>
          {title}
        </h2>
        {done && !open && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="focus-ring rounded-xs text-small font-medium underline underline-offset-4"
          >
            {t('checkout.edit')}
          </button>
        )}
      </div>
      {open ? (
        <div className="mt-5">{children}</div>
      ) : done && summary ? (
        <div className="mt-3 pl-10 text-small text-fg-muted">{summary}</div>
      ) : null}
    </section>
  );
}

const addressLine = (a: Partial<AddressInput>) =>
  [
    [a.firstName, a.lastName].filter(Boolean).join(' '),
    a.line1,
    a.line2,
    [a.postcode, a.city, a.regionCode].filter(Boolean).join(' '),
    a.countryCode,
  ]
    .filter(Boolean)
    .join(', ');

/**
 * One-page checkout (docs/STYLE-GUIDE.md §13.5): contact → address → delivery → payment, each step
 * saved to the shop's cart as it's completed (the shop re-prices taxes and shipping), then the order
 * is placed with an idempotency key and paid — on site or by redirect.
 */
export function Checkout({ storeCountry }: { storeCountry: string }) {
  const { t } = useI18n();
  const store = useStore();
  const to = useHref();
  const router = useRouter();
  const { cart, load, change, clear } = useCart();
  const [editing, setEditing] = useState<Step | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<Partial<AddressInput>>({});
  const [billing, setBilling] = useState<Partial<AddressInput>>({});
  const [billingSame, setBillingSame] = useState(true);
  const [tried, setTried] = useState(false);
  // Fields the shop refused (validation it does and the form doesn't).
  const [apiFields, setApiFields] = useState<{ shipping: AddressField[]; billing: AddressField[] }>(
    {
      shipping: [],
      billing: [],
    },
  );
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [method, setMethod] = useState<string>('');
  // The delivery choice shows at once; the shop re-prices in the background.
  const [pendingDelivery, setPendingDelivery] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Signed-in customers: their e-mail and saved addresses (the hint cookie avoids a 401 for guests).
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  // Load the cart, then whatever its saved steps unlock (a returning shopper, a reload).
  useEffect(() => {
    void load(true).then(async (c) => {
      if (!c) return;
      if (document.cookie.includes(`${SIGNED_IN_COOKIE}=1`)) {
        const [profile, addresses] = await Promise.all([
          sf<{ email: string }>(store.ctx, 'account').catch(() => null),
          sf<SavedAddress[]>(store.ctx, 'account/addresses').catch(() => []),
        ]);
        setSaved(addresses);
        if (profile && !c.email) {
          setEmail(profile.email);
          await change('cart/email', {
            method: 'PUT',
            body: JSON.stringify({ email: profile.email }),
          });
        }
        const def = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
        if (def && !c.shippingAddress) setShipping(savedToInput(def));
      }
      if (c.requiresShipping && c.shippingAddress)
        setOptions(await sf<ShippingOption[]>(store.ctx, 'cart/shipping-methods').catch(() => []));
      if (!c.requiresShipping || c.shippingAddress) {
        const list = await sf<PaymentMethod[]>(store.ctx, 'cart/payment-methods').catch(() => []);
        setMethods(list);
        setMethod((m) => m || (list.length === 1 ? list[0].code : ''));
      }
    });
  }, [load, change, store.ctx]);

  // Seed the forms once from what the cart already holds (a returning shopper, a reload).
  if (cart && !seeded) {
    setSeeded(true);
    setEmail(cart.email ?? '');
    setShipping(
      cart.shippingAddress ? toInput(cart.shippingAddress) : { countryCode: storeCountry },
    );
    if (cart.billingAddress) {
      setBilling(toInput(cart.billingAddress));
      setBillingSame(
        addressLine(toInput(cart.billingAddress)) === addressLine(toInput(cart.shippingAddress)),
      );
    }
  }

  const done: Record<Step, boolean> = {
    contact: !!cart?.email,
    address: !!cart && (!cart.requiresShipping || !!cart.shippingAddress),
    delivery: !!cart && (!cart.requiresShipping || !!cart.shippingMethod),
    payment: !!method,
  };
  const order: Step[] = ['contact', 'address', 'delivery', 'payment'];
  const current = editing ?? order.find((s) => !done[s]) ?? 'payment';

  const loadOptions = useCallback(async () => {
    try {
      const list = await sf<ShippingOption[]>(store.ctx, 'cart/shipping-methods');
      setOptions(list);
      return list;
    } catch {
      setOptions([]);
      return [];
    }
  }, [store.ctx]);
  const loadMethods = useCallback(async () => {
    try {
      const list = await sf<PaymentMethod[]>(store.ctx, 'cart/payment-methods');
      setMethods(list);
      setMethod((m) => m || (list.length === 1 ? list[0].code : ''));
    } catch {
      setMethods([]);
    }
  }, [store.ctx]);

  if (cart === null)
    return (
      <div className="container-page grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_420px]" aria-busy>
        <span className="sr-only">{t('cart.loading')}</span>
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  if (!cart?.items.length)
    return (
      <div className="container-page grid justify-items-center gap-3 py-24 text-center">
        <ShoppingBag aria-hidden className="size-8" strokeWidth={1.5} />
        <h1 className="text-h2">{t('cart.empty')}</h1>
        <p className="text-fg-muted">{t('cart.emptyBody')}</p>
        <Link href={to('/')} className={cn(buttonVariants(), 'mt-3')}>
          {t('cart.continue')}
        </Link>
      </div>
    );

  const saveEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setEmailError(t('checkout.invalidEmail'));
    setEmailError(null);
    setBusy('contact');
    const message = await change('cart/email', {
      method: 'PUT',
      body: JSON.stringify({ email: email.trim() }),
    });
    setBusy(null);
    if (message) return setEmailError(message);
    setEditing(null);
  };

  const shipProblems = addressProblems(shipping);
  const billProblems = billingSame ? [] : addressProblems(billing);
  const saveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (shipProblems.length || billProblems.length) {
      // Take the shopper to the first field to fix.
      const first = shipProblems[0] ? `ship-${shipProblems[0]}` : `bill-${billProblems[0]}`;
      document.getElementById(first)?.focus();
      return;
    }
    setBusy('address');
    setError(null);
    const message = await change('cart/addresses', {
      method: 'PUT',
      body: JSON.stringify({
        shipping: cleanAddress(shipping),
        ...(billingSame ? {} : { billing: cleanAddress(billing) }),
      }),
    });
    setBusy(null);
    if (message) {
      const fields = fieldsFromApiError(message);
      setApiFields(fields);
      // Field-level problems are shown on the fields; never show the raw validation text.
      return setError(
        fields.shipping.length || fields.billing.length ? t('checkout.checkFields') : message,
      );
    }
    setApiFields({ shipping: [], billing: [] });
    setTried(false);
    setEditing(null);
    const list = await loadOptions();
    // One way to deliver: choose it for the shopper.
    if (list.length === 1 && !cart.shippingMethod)
      await change('cart/shipping-method', {
        method: 'PUT',
        body: JSON.stringify({ code: list[0].code }),
      });
    void loadMethods();
  };

  const chooseDelivery = async (code: string) => {
    setPendingDelivery(code);
    setBusy('delivery');
    setError(null);
    const message = await change('cart/shipping-method', {
      method: 'PUT',
      body: JSON.stringify({ code }),
    });
    setBusy(null);
    setPendingDelivery(null);
    if (message) return setError(message);
    setEditing(null);
  };

  const missing = cart.missing.length > 0 || !method;
  const place = async () => {
    setError(null);
    if (missing) {
      setError(t('checkout.missing'));
      return;
    }
    setBusy('place');
    let placed: Order;
    try {
      placed = await sf<Order>(store.ctx, 'orders', {
        method: 'POST',
        body: '{}',
        headers: { 'idempotency-key': idempotencyKey(cart.id, cart.version) },
      });
      clear();
    } catch (e) {
      setBusy(null);
      setError(e instanceof GatewayError ? e.message : t('checkout.error'));
      void load(true);
      return;
    }
    try {
      setBusy('pay');
      const { redirected } = await startPayment(store.ctx, store.prefix, placed.number, method);
      if (!redirected)
        router.push(`${to(`/orders/${encodeURIComponent(placed.number)}`)}?placed=1`);
    } catch {
      // The order exists; its page offers to pay again.
      router.push(`${to(`/orders/${encodeURIComponent(placed.number)}`)}?placed=1&payment=failed`);
    }
  };

  const shippingSummary = cart.shippingAddress ? addressLine(toInput(cart.shippingAddress)) : '';
  const summaryPanel = (
    <div className="grid gap-5">
      <CartLines cart={cart} compact readOnly />
      <CouponForm cart={cart} />
      <CartTotals cart={cart} stage="checkout" />
    </div>
  );

  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="sr-only">{t('checkout.title')}</h1>

      {/* Phones: the summary folds away above the form. */}
      <div className="mb-4 rounded-card bg-surface lg:hidden">
        <button
          type="button"
          aria-expanded={summaryOpen}
          aria-controls="checkout-summary-mobile"
          onClick={() => setSummaryOpen((o) => !o)}
          className="focus-ring flex w-full items-center justify-between gap-3 rounded-card px-5 py-4 text-small font-medium"
        >
          <span className="inline-flex items-center gap-2">
            <ShoppingBag aria-hidden className="size-4" />
            {summaryOpen ? t('cart.hideSummary') : t('cart.showSummary')}
            <ChevronDown
              aria-hidden
              className={cn('size-4 transition-transform', summaryOpen && 'rotate-180')}
            />
          </span>
          <span className="tabular text-body font-semibold">{cart.totals.amountDue.formatted}</span>
        </button>
        {summaryOpen && (
          <div id="checkout-summary-mobile" className="border-t border-border p-5">
            {summaryPanel}
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
        <div className="grid gap-4">
          <Section
            n={1}
            title={t('checkout.contact')}
            done={done.contact}
            open={current === 'contact'}
            summary={cart.email}
            onEdit={() => setEditing('contact')}
          >
            <form onSubmit={saveEmail} className="grid gap-4" noValidate>
              <Field
                id="co-email"
                label={t('checkout.email')}
                hint={t('checkout.emailHint')}
                error={emailError ?? undefined}
                required
              >
                <Input
                  id="co-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!emailError || undefined}
                  aria-describedby={emailError ? 'co-email-error' : 'co-email-hint'}
                />
              </Field>
              <Button
                type="submit"
                size="lg"
                loading={busy === 'contact'}
                className="justify-self-start"
              >
                {t('checkout.continue')}
              </Button>
            </form>
          </Section>

          {cart.requiresShipping ? (
            <Section
              n={2}
              title={t('checkout.shippingAddress')}
              done={done.address}
              open={current === 'address' && done.contact}
              summary={shippingSummary}
              onEdit={() => setEditing('address')}
            >
              <form onSubmit={saveAddress} className="grid gap-6" noValidate>
                {saved.length > 0 && (
                  <fieldset className="grid gap-2">
                    <legend className="mb-2 text-small font-semibold">
                      {t('checkout.savedAddresses')}
                    </legend>
                    {saved.map((a) => {
                      const on = addressLine(savedToInput(a)) === addressLine(shipping);
                      return (
                        <label
                          key={a.id}
                          className={cn(
                            'flex min-h-14 cursor-pointer items-center gap-3 rounded-control border px-4 py-3 text-small',
                            on ? 'border-fg' : 'border-border hover:border-border-strong',
                          )}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            checked={on}
                            onChange={() => setShipping(savedToInput(a))}
                            className="size-4 accent-[var(--primary)]"
                          />
                          {addressLine(savedToInput(a))}
                        </label>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShipping({ countryCode: storeCountry })}
                      className="focus-ring justify-self-start rounded-xs text-small font-medium underline underline-offset-4"
                    >
                      {t('checkout.newAddress')}
                    </button>
                  </fieldset>
                )}
                <AddressForm
                  id="ship"
                  section="shipping"
                  value={shipping}
                  onChange={setShipping}
                  errors={[...(tried ? shipProblems : []), ...apiFields.shipping]}
                  storeCountry={storeCountry}
                />
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-small">
                  <input
                    type="checkbox"
                    checked={billingSame}
                    onChange={(e) => setBillingSame(e.target.checked)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {t('checkout.billingSame')}
                </label>
                {!billingSame && (
                  <fieldset className="grid gap-4">
                    <legend className="mb-4 text-small font-semibold">
                      {t('checkout.billingAddress')}
                    </legend>
                    <AddressForm
                      id="bill"
                      section="billing"
                      value={billing}
                      onChange={setBilling}
                      errors={[...(tried ? billProblems : []), ...apiFields.billing]}
                      storeCountry={storeCountry}
                    />
                  </fieldset>
                )}
                <Button
                  type="submit"
                  size="lg"
                  loading={busy === 'address'}
                  className="justify-self-start"
                >
                  {t('checkout.continue')}
                </Button>
              </form>
            </Section>
          ) : (
            <Section
              n={2}
              title={t('checkout.delivery')}
              done
              open={false}
              summary={t('checkout.noShipping')}
            >
              {null}
            </Section>
          )}

          {cart.requiresShipping && (
            <Section
              n={3}
              title={t('checkout.delivery')}
              done={done.delivery}
              open={current === 'delivery' && done.address}
              summary={
                cart.shippingMethod
                  ? `${cart.shippingMethod.name} · ${cart.shippingMethod.price.amount ? cart.shippingMethod.price.formatted : t('cart.free')}`
                  : undefined
              }
              onEdit={() => setEditing('delivery')}
            >
              {options === null ? (
                <p className="flex items-center gap-2 text-small text-fg-muted">
                  <Spinner /> {t('cart.loading')}
                </p>
              ) : options.length ? (
                <fieldset>
                  <legend className="sr-only">{t('checkout.delivery')}</legend>
                  <div className="grid gap-2">
                    {options.map((o) => {
                      const on = (pendingDelivery ?? cart.shippingMethod?.code) === o.code;
                      return (
                        <label
                          key={o.code}
                          className={cn(
                            'flex min-h-16 cursor-pointer items-center gap-4 rounded-control border px-4 py-3',
                            on ? 'border-fg' : 'border-border hover:border-border-strong',
                            busy === 'delivery' && 'opacity-60',
                          )}
                        >
                          <input
                            type="radio"
                            name="delivery"
                            checked={on}
                            disabled={busy === 'delivery'}
                            onChange={() => void chooseDelivery(o.code)}
                            className="size-4 accent-[var(--primary)]"
                          />
                          <span className="grid flex-1 gap-0.5">
                            <span className="text-small font-semibold">{o.name}</span>
                            {o.description && (
                              <span className="text-caption text-fg-muted">{o.description}</span>
                            )}
                          </span>
                          <span className="tabular text-small font-semibold">
                            {o.price.amount ? o.price.formatted : t('cart.free')}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : (
                <Notice tone="warning">{t('checkout.deliveryHint')}</Notice>
              )}
            </Section>
          )}

          <Section
            n={cart.requiresShipping ? 4 : 3}
            title={t('checkout.payment')}
            done={done.payment}
            open={done.delivery && done.contact && done.address}
            summary={methods?.find((m) => m.code === method)?.title}
          >
            {methods === null ? (
              <p className="flex items-center gap-2 text-small text-fg-muted">
                <Spinner /> {t('cart.loading')}
              </p>
            ) : methods.length ? (
              <fieldset>
                <legend className="sr-only">{t('checkout.payment')}</legend>
                <div className="grid gap-2">
                  {methods.map((m) => (
                    <label
                      key={m.code}
                      className={cn(
                        'flex min-h-16 cursor-pointer items-center gap-4 rounded-control border px-4 py-3',
                        method === m.code
                          ? 'border-fg'
                          : 'border-border hover:border-border-strong',
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={method === m.code}
                        onChange={() => setMethod(m.code)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      <span className="grid gap-0.5">
                        <span className="text-small font-semibold">{m.title}</span>
                        {m.description && (
                          <span className="text-caption text-fg-muted">{m.description}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <Notice tone="warning">{t('checkout.paymentNone')}</Notice>
            )}
          </Section>

          <div className="grid gap-3 rounded-card bg-surface p-5 sm:p-7">
            {error && <Notice tone="danger" title={error} />}
            <Button
              size="lg"
              block
              onClick={() => void place()}
              loading={busy === 'place' || busy === 'pay'}
              disabled={busy !== null && busy !== 'place' && busy !== 'pay'}
            >
              <Lock aria-hidden />
              {busy === 'pay'
                ? t('checkout.redirecting')
                : busy === 'place'
                  ? t('checkout.placing')
                  : `${t('checkout.placeOrder')} · ${cart.totals.amountDue.formatted}`}
            </Button>
            <p className="text-center text-caption text-fg-muted">{t('checkout.terms')}</p>
          </div>
        </div>

        <aside
          aria-label={t('cart.summary')}
          className="hidden rounded-card bg-surface p-6 lg:sticky lg:top-6 lg:block"
        >
          <h2 className="mb-5 text-h4">{t('cart.summary')}</h2>
          {summaryPanel}
        </aside>
      </div>
    </div>
  );
}
