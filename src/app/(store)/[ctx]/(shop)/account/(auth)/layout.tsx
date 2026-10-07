import type { ReactNode } from 'react';

/** Sign-in and registration: a narrow, centred card (docs/STYLE-GUIDE.md §13.7). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-page grid place-items-center py-12 md:py-20">
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-sm sm:p-10">
        {children}
      </div>
    </div>
  );
}
