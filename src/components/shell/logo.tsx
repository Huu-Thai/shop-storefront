import { cn } from '@/lib/cn';
import { themeConfig } from '@/theme/config';

/** Wordmark with the accent dot (docs/THEMING.md → Branding). Replace with an SVG logo if you have one. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 font-display text-[22px] leading-none font-bold tracking-[-0.04em]',
        className,
      )}
    >
      {themeConfig.name}
      <span aria-hidden className="inline-block size-2 rounded-full bg-accent" />
    </span>
  );
}
