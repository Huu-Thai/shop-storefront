'use client';

import { useMemo } from 'react';
import { Field, Input, Select } from '@/components/ui/field';
import { useI18n } from '@/i18n/client';
import {
  type AddressField,
  type AddressInput,
  countryOptions,
  postcodeRequired,
  REGIONS,
} from '@/lib/address';

/**
 * Address fields with the browser's autofill tokens, a country list in the shopper's language and
 * a region list where one is expected. `errors` are shown only after the shopper tries to continue.
 */
export function AddressForm({
  id,
  value,
  onChange,
  errors,
  storeCountry,
  section,
}: {
  id: string;
  value: Partial<AddressInput>;
  onChange: (v: Partial<AddressInput>) => void;
  errors: AddressField[];
  storeCountry: string;
  /** Autofill section ("shipping" / "billing"). */
  section: 'shipping' | 'billing';
}) {
  const { t, locale } = useI18n();
  const countries = useMemo(() => countryOptions(locale, storeCountry), [locale, storeCountry]);
  const regions = value.countryCode ? REGIONS[value.countryCode] : undefined;
  const set = (k: AddressField) => (e: { target: { value: string } }) =>
    onChange({ ...value, [k]: e.target.value });
  const err = (k: AddressField) =>
    errors.includes(k)
      ? k === 'regionCode' && !regions && value.regionCode
        ? t('checkout.invalidCode')
        : t('checkout.required')
      : undefined;
  const ac = (token: string) => `section-${id} ${section} ${token}`;
  const fid = (k: string) => `${id}-${k}`;
  const describedBy = (k: AddressField) => (errors.includes(k) ? `${fid(k)}-error` : undefined);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        id={fid('firstName')}
        label={t('checkout.firstName')}
        required
        error={err('firstName')}
      >
        <Input
          id={fid('firstName')}
          autoComplete={ac('given-name')}
          value={value.firstName ?? ''}
          onChange={set('firstName')}
          aria-invalid={errors.includes('firstName') || undefined}
          aria-describedby={describedBy('firstName')}
        />
      </Field>
      <Field id={fid('lastName')} label={t('checkout.lastName')} required error={err('lastName')}>
        <Input
          id={fid('lastName')}
          autoComplete={ac('family-name')}
          value={value.lastName ?? ''}
          onChange={set('lastName')}
          aria-invalid={errors.includes('lastName') || undefined}
          aria-describedby={describedBy('lastName')}
        />
      </Field>
      <Field
        id={fid('countryCode')}
        label={t('checkout.country')}
        required
        error={err('countryCode')}
        className="sm:col-span-2"
      >
        <Select
          id={fid('countryCode')}
          autoComplete={ac('country')}
          value={value.countryCode ?? ''}
          onChange={(e) => onChange({ ...value, countryCode: e.target.value, regionCode: '' })}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id={fid('line1')}
        label={t('checkout.line1')}
        required
        error={err('line1')}
        className="sm:col-span-2"
      >
        <Input
          id={fid('line1')}
          autoComplete={ac('address-line1')}
          value={value.line1 ?? ''}
          onChange={set('line1')}
          aria-invalid={errors.includes('line1') || undefined}
          aria-describedby={describedBy('line1')}
        />
      </Field>
      <Field id={fid('line2')} label={t('checkout.line2')} className="sm:col-span-2">
        <Input
          id={fid('line2')}
          autoComplete={ac('address-line2')}
          value={value.line2 ?? ''}
          onChange={set('line2')}
        />
      </Field>
      <Field id={fid('city')} label={t('checkout.city')} required error={err('city')}>
        <Input
          id={fid('city')}
          autoComplete={ac('address-level2')}
          value={value.city ?? ''}
          onChange={set('city')}
          aria-invalid={errors.includes('city') || undefined}
          aria-describedby={describedBy('city')}
        />
      </Field>
      <Field
        id={fid('regionCode')}
        label={regions ? t('checkout.region') : t('checkout.regionCode')}
        hint={regions ? undefined : t('checkout.regionHint')}
        required={!!regions}
        error={err('regionCode')}
      >
        {regions ? (
          <Select
            id={fid('regionCode')}
            autoComplete={ac('address-level1')}
            value={value.regionCode ?? ''}
            onChange={set('regionCode')}
            aria-invalid={errors.includes('regionCode') || undefined}
            aria-describedby={describedBy('regionCode')}
          >
            <option value="">{t('checkout.choose')}</option>
            {Object.entries(regions).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
        ) : (
          // The shop stores subdivision codes (NSW, HN), not names.
          <Input
            id={fid('regionCode')}
            value={value.regionCode ?? ''}
            onChange={(e) => onChange({ ...value, regionCode: e.target.value.toUpperCase() })}
            maxLength={16}
            autoCapitalize="characters"
            autoComplete="off"
            aria-invalid={errors.includes('regionCode') || undefined}
            aria-describedby={
              errors.includes('regionCode')
                ? `${fid('regionCode')}-error`
                : `${fid('regionCode')}-hint`
            }
          />
        )}
      </Field>
      <Field
        id={fid('postcode')}
        label={t('checkout.postcode')}
        required={postcodeRequired(value.countryCode)}
        error={err('postcode')}
      >
        <Input
          id={fid('postcode')}
          autoComplete={ac('postal-code')}
          value={value.postcode ?? ''}
          onChange={set('postcode')}
          aria-invalid={errors.includes('postcode') || undefined}
          aria-describedby={describedBy('postcode')}
        />
      </Field>
      <Field id={fid('phone')} label={t('checkout.phone')} required error={err('phone')}>
        <Input
          id={fid('phone')}
          type="tel"
          autoComplete={ac('tel')}
          value={value.phone ?? ''}
          onChange={set('phone')}
          aria-invalid={errors.includes('phone') || undefined}
          aria-describedby={describedBy('phone')}
        />
      </Field>
      <Field id={fid('company')} label={t('checkout.company')} className="sm:col-span-2">
        <Input
          id={fid('company')}
          autoComplete={ac('organization')}
          value={value.company ?? ''}
          onChange={set('company')}
        />
      </Field>
    </div>
  );
}
