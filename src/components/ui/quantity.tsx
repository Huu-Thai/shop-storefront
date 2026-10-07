'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

/** − n + stepper for cart lines and the product page; 44 px targets, typed input allowed. */
export function Quantity({
  value,
  onChange,
  min = 1,
  max = 999,
  label,
  labels = { decrease: 'Decrease quantity', increase: 'Increase quantity' },
  disabled,
  size = 'md',
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Accessible name of the input, e.g. "Quantity, Classic Tee". */
  label: string;
  labels?: { decrease: string; increase: string };
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(n) ? n : min)));
  const btn =
    'focus-ring flex shrink-0 items-center justify-center rounded-full text-fg hover:bg-surface-sunken disabled:opacity-40 [&_svg]:size-4';
  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-button border border-border-strong bg-surface',
        h,
        className,
      )}
    >
      <button
        type="button"
        className={cn(btn, size === 'sm' ? 'size-9' : 'size-11')}
        aria-label={labels.decrease}
        disabled={disabled || value <= min}
        onClick={() => set(value - 1)}
      >
        <Minus aria-hidden />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        className="tabular w-10 bg-transparent text-center text-body font-medium outline-none"
        value={value}
        disabled={disabled}
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, ''), 10))}
      />
      <button
        type="button"
        className={cn(btn, size === 'sm' ? 'size-9' : 'size-11')}
        aria-label={labels.increase}
        disabled={disabled || value >= max}
        onClick={() => set(value + 1)}
      >
        <Plus aria-hidden />
      </button>
    </div>
  );
}
