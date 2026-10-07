/**
 * Shopper preferences kept in cookies / local storage. None of them is read while rendering a
 * cached page: the proxy turns the currency into the route, and mode / accent preset are applied by
 * an inline script before first paint (src/components/theme-script.tsx).
 */
export const CURRENCY_COOKIE = 'sf_currency';
export const MODE_STORAGE = 'sf_mode';
export const PRESET_STORAGE = 'sf_preset';
/** One year; preferences, not tracking. */
export const PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;
/** Readable hint for cached pages and client code: "a customer is signed in on this device". */
export const SIGNED_IN_COOKIE = 'sf_signed_in';
