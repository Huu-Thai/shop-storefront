'use client';

import { X } from 'lucide-react';
import { Dialog as D } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useReturnFocus } from './use-return-focus';

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;

/**
 * Side drawer: cart (right), navigation and filters (left). Full width on phones, `--drawer-width`
 * from 480 px up. Traps focus, closes with Esc and returns focus to what opened it.
 */
export function SheetContent({
  side = 'right',
  title,
  description,
  children,
  footer,
  closeLabel = 'Close',
  className,
}: {
  side?: 'left' | 'right';
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}) {
  const onCloseAutoFocus = useReturnFocus();
  return (
    <D.Portal>
      <D.Overlay className="animate-fade fixed inset-0 z-50 bg-overlay" />
      <D.Content
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn(
          'fixed inset-y-0 z-50 flex w-full flex-col bg-surface shadow-lg sm:max-w-[var(--drawer-width)]',
          side === 'right' ? 'sf-drawer-right right-0' : 'sf-drawer-left left-0',
          className,
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-h4">{title}</D.Title>
            <D.Description className={description ? 'text-small text-fg-muted' : 'sr-only'}>
              {description ?? title}
            </D.Description>
          </div>
          <D.Close
            aria-label={closeLabel}
            className="focus-ring -mr-2 flex size-11 items-center justify-center rounded-full text-fg hover:bg-surface-sunken"
          >
            <X aria-hidden className="size-5" />
          </D.Close>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <footer className="border-t border-border p-5">{footer}</footer>}
      </D.Content>
    </D.Portal>
  );
}
