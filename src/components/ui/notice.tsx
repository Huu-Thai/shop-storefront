import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  info: { cls: 'bg-info-soft text-info-fg', icon: Info },
  success: { cls: 'bg-success-soft text-success-fg', icon: CircleCheck },
  warning: { cls: 'bg-warning-soft text-warning-fg', icon: TriangleAlert },
  danger: { cls: 'bg-danger-soft text-danger-fg', icon: CircleAlert },
};

/** Inline message (form errors, cart warnings). Errors are announced (`role="alert"`). */
export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { cls, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control px-4 py-3 text-small', cls, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-[18px] shrink-0" />
      <div className="grid gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
