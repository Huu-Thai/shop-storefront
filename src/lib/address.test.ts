import { describe, expect, it } from 'vitest';
import {
  addressProblems,
  cleanAddress,
  countryOptions,
  fieldsFromApiError,
  isEmail,
} from './address';

const ok = {
  firstName: 'Ann',
  lastName: 'Lee',
  phone: '+1 213 555 0100',
  countryCode: 'US',
  regionCode: 'CA',
  city: 'LA',
  postcode: '90001',
  line1: '1 Main St',
};

describe('address form', () => {
  it('accepts a complete address', () => expect(addressProblems(ok)).toEqual([]));
  it('needs a valid US state and postcode, but no postcode in Vietnam', () => {
    expect(addressProblems({ ...ok, regionCode: 'XX', postcode: '' })).toEqual([
      'regionCode',
      'postcode',
    ]);
    expect(addressProblems({ ...ok, countryCode: 'VN', regionCode: '', postcode: '' })).toEqual([]);
    // The shop takes subdivision codes only (found with a real order: free text was refused).
    expect(addressProblems({ ...ok, countryCode: 'VN', regionCode: 'Hà Nội' })).toEqual([
      'regionCode',
    ]);
    expect(
      addressProblems({ ...ok, countryCode: 'AU', regionCode: 'nsw', postcode: '2000' }),
    ).toEqual([]);
  });
  it('flags missing names and odd phone numbers', () => {
    expect(addressProblems({ ...ok, firstName: ' ', phone: 'call me' })).toEqual([
      'firstName',
      'phone',
    ]);
  });
  it('lists countries in the shopper’s language, the store’s country first', () => {
    const vi = countryOptions('vi-VN', 'VN');
    expect(vi[0]).toEqual({ code: 'VN', name: 'Việt Nam' });
    expect(countryOptions('en-US').find((c) => c.code === 'DE')?.name).toBe('Germany');
  });
  it('checks e-mails and trims addresses', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(cleanAddress({ firstName: ' Ann ', company: '', line2: undefined })).toEqual({
      firstName: 'Ann',
    });
  });
  it('upper-cases region codes', () => {
    expect(cleanAddress({ regionCode: ' nsw ' })).toEqual({ regionCode: 'NSW' });
  });
  it('maps shop validation messages to fields', () => {
    expect(
      fieldsFromApiError('shipping.regionCode must match /x/, billing.postcode must be shorter'),
    ).toEqual({ shipping: ['regionCode'], billing: ['postcode'] });
  });
});
