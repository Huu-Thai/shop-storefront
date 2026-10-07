/**
 * The shop's password policy (RegisterDto): at least 12 characters, using at least three of
 * lowercase, uppercase, digits and symbols. Checked in the form so shoppers get instant feedback.
 */
export function passwordStrong(pw: string): boolean {
  if (pw.length < 12) return false;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  return classes >= 3;
}

/** A redirect target from a form: only paths on this site (no `//host`, no schemes). */
export function safeNext(next: unknown, fallback: string): string {
  return typeof next === 'string' && /^\/(?!\/)[^\s\\]*$/.test(next) ? next : fallback;
}
