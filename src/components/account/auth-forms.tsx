'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useActionState, useState } from 'react';
import { Link } from '@/components/intent-link';
import { useHref, useStore } from '@/components/store/store-context';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { useI18n } from '@/i18n/client';
import { type AuthState, register, signIn } from '@/server/account-actions';

function PasswordInput({
  id,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string;
  autoComplete: string;
  invalid: boolean;
  describedBy?: string;
}) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name="password"
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={shown}
        className="focus-ring absolute top-1/2 right-1.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:text-fg"
      >
        {shown ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  );
}

const describe = (id: string, state: AuthState | null, key: string, hint?: boolean) =>
  state?.fields?.[key] ? `${id}-error` : hint ? `${id}-hint` : undefined;

/**
 * Sign-in form (Server Action): works without JavaScript; with it, errors appear inline without a
 * reload. The password never leaves the server action; tokens go into an httpOnly cookie.
 */
export function SignInForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const store = useStore();
  const to = useHref();
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="ctx" value={store.ctx} />
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && <Notice tone="danger" title={state.error} />}
      <Field id="si-email" label={t('auth.email')} error={state?.fields?.email}>
        <Input
          id="si-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          aria-invalid={!!state?.fields?.email || undefined}
          aria-describedby={describe('si-email', state, 'email')}
        />
      </Field>
      <Field id="si-password" label={t('auth.password')} error={state?.fields?.password}>
        <PasswordInput
          id="si-password"
          autoComplete="current-password"
          invalid={!!state?.fields?.password}
          describedBy={describe('si-password', state, 'password')}
        />
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        {t('auth.signIn')}
      </Button>
      <p className="text-small text-fg-muted">{t('auth.forgot')}</p>
      <p className="border-t border-border pt-5 text-small">
        {t('auth.noAccount')}{' '}
        <Link
          href={`${to('/account/register')}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="focus-ring rounded-xs font-semibold underline underline-offset-4"
        >
          {t('auth.register')}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const store = useStore();
  const to = useHref();
  const [state, action, pending] = useActionState(register, null);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="ctx" value={store.ctx} />
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && <Notice tone="danger" title={state.error} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="rg-first" label={t('auth.firstName')} required error={state?.fields?.firstName}>
          <Input
            id="rg-first"
            name="firstName"
            autoComplete="given-name"
            defaultValue={state?.values?.firstName}
            aria-invalid={!!state?.fields?.firstName || undefined}
            aria-describedby={describe('rg-first', state, 'firstName')}
          />
        </Field>
        <Field id="rg-last" label={t('auth.lastName')} required error={state?.fields?.lastName}>
          <Input
            id="rg-last"
            name="lastName"
            autoComplete="family-name"
            defaultValue={state?.values?.lastName}
            aria-invalid={!!state?.fields?.lastName || undefined}
            aria-describedby={describe('rg-last', state, 'lastName')}
          />
        </Field>
      </div>
      <Field id="rg-email" label={t('auth.email')} required error={state?.fields?.email}>
        <Input
          id="rg-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          aria-invalid={!!state?.fields?.email || undefined}
          aria-describedby={describe('rg-email', state, 'email')}
        />
      </Field>
      <Field
        id="rg-password"
        label={t('auth.password')}
        required
        hint={t('auth.passwordHint')}
        error={state?.fields?.password}
      >
        <PasswordInput
          id="rg-password"
          autoComplete="new-password"
          invalid={!!state?.fields?.password}
          describedBy={describe('rg-password', state, 'password', true)}
        />
      </Field>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-small">
        <input
          type="checkbox"
          name="acceptsMarketing"
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        {t('auth.marketing')}
      </label>
      <Button type="submit" size="lg" block loading={pending}>
        {t('auth.register')}
      </Button>
      <p className="border-t border-border pt-5 text-small">
        {t('auth.haveAccount')}{' '}
        <Link
          href={`${to('/account/sign-in')}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="focus-ring rounded-xs font-semibold underline underline-offset-4"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </form>
  );
}
