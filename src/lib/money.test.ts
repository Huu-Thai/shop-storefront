import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('uses the currency’s own decimals', () => {
    expect(formatMoney(2550, 'USD', 'en-US')).toBe('$25.50');
    expect(formatMoney(399000, 'VND', 'vi-VN').replace(/\s/g, ' ')).toBe('399.000 ₫');
  });
});
