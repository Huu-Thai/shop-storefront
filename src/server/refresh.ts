import { type Session, sessionFromTokens } from './session-crypto';

export type RefreshOutcome =
  | { status: 'refreshed'; session: Session }
  /** The shop refused the refresh token (expired, revoked, reused): the customer is signed out. */
  | { status: 'rejected' }
  /** The shop could not be reached: keep the session, try again later. */
  | { status: 'unavailable' };

/**
 * Refresh tokens are single-use: replaying one revokes the whole session. Requests that arrive
 * together with the same expiring session share one refresh call.
 */
const inFlight = new Map<string, Promise<RefreshOutcome>>();

export function refreshSession(
  apiBase: string,
  session: Session,
  fetchImpl: typeof fetch = fetch,
): Promise<RefreshOutcome> {
  const existing = inFlight.get(session.refreshToken);
  if (existing) return existing;
  const run = (async (): Promise<RefreshOutcome> => {
    try {
      const res = await fetchImpl(`${apiBase}/store/account/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-store': session.store },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 400 || res.status === 403)
        return { status: 'rejected' };
      if (!res.ok) return { status: 'unavailable' };
      return { status: 'refreshed', session: sessionFromTokens(await res.json(), session.store) };
    } catch {
      return { status: 'unavailable' };
    }
  })();
  inFlight.set(session.refreshToken, run);
  // Keep the result briefly so requests that read the old cookie a moment later reuse it.
  void run.finally(() => setTimeout(() => inFlight.delete(session.refreshToken), 30_000));
  return run;
}
