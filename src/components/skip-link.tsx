'use client';

/**
 * "Skip to content". After client navigations Next keeps the previous page mounted (hidden) for
 * instant back/forward, so `#main` can match a hidden <main>; this focuses the visible one.
 */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      onClick={(e) => {
        const main = [...document.querySelectorAll<HTMLElement>('main')].find(
          (m) => m.offsetParent !== null || m.getClientRects().length > 0,
        );
        if (!main) return;
        e.preventDefault();
        main.focus();
        main.scrollIntoView();
      }}
      className="focus-ring sr-only z-50 rounded-button bg-primary px-5 py-3 font-semibold text-primary-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {label}
    </a>
  );
}
