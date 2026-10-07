import { describe, expect, it } from 'vitest';
import { passwordStrong, safeNext } from './password';

describe('password policy', () => {
  it('needs 12 characters and three kinds', () => {
    expect(passwordStrong('short1A!')).toBe(false);
    expect(passwordStrong('alllowercaseletters')).toBe(false);
    expect(passwordStrong('lowerUPPER12')).toBe(true);
    expect(passwordStrong('lower-upper-12')).toBe(true);
  });
});

describe('safeNext', () => {
  it('keeps same-site paths only', () => {
    expect(safeNext('/vn-vi/account/orders', '/account')).toBe('/vn-vi/account/orders');
    expect(safeNext('//evil.example', '/account')).toBe('/account');
    expect(safeNext('https://evil.example', '/account')).toBe('/account');
    expect(safeNext('/\\evil', '/account')).toBe('/account');
    expect(safeNext(undefined, '/account')).toBe('/account');
  });
});
