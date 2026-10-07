import { describe, expect, it, vi } from 'vitest';
import { resolveForProxy } from './url-cache';

const ctx = { store: 'us-en', locale: 'en-US', currency: 'USD' };
const answer = (status: number, body: object = {}) =>
  vi.fn(async () => Response.json(body, { status })) as unknown as typeof fetch;

describe('resolveForProxy', () => {
  it('passes real pages through', async () => {
    expect(
      await resolveForProxy('http://api', ctx, '/men', answer(200, { canonicalPath: 'men' })),
    ).toEqual({ kind: 'page' });
  });
  it('sends other spellings to the canonical path', async () => {
    expect(
      await resolveForProxy('http://api', ctx, '/MEN', answer(200, { canonicalPath: 'men' })),
    ).toEqual({
      kind: 'redirect',
      location: '/men',
      status: 308,
    });
  });
  it('follows the shop’s redirects', async () => {
    const f = answer(200, { canonicalPath: 'old', redirectStatus: 301, location: '/new' });
    expect(await resolveForProxy('http://api', ctx, '/old', f)).toEqual({
      kind: 'redirect',
      location: '/new',
      status: 301,
    });
  });
  it('reports missing paths and remembers answers for a minute', async () => {
    const f = answer(404);
    expect(await resolveForProxy('http://api', ctx, '/nope-1', f, 1_000)).toEqual({
      kind: 'missing',
    });
    await resolveForProxy('http://api', ctx, '/nope-1', f, 30_000);
    expect(f).toHaveBeenCalledTimes(1);
    await resolveForProxy('http://api', ctx, '/nope-1', f, 70_000);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('never 404s good URLs when the shop is down or failing', async () => {
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    expect(await resolveForProxy('http://api', ctx, '/men-x', down)).toEqual({ kind: 'page' });
    expect(await resolveForProxy('http://api', ctx, '/men-y', answer(500))).toEqual({
      kind: 'page',
    });
  });
});
