'use client';

import { useEffect, useState } from 'react';
import { lastFocused } from '@/lib/last-focus';

/**
 * Return focus to whatever opened an overlay. Radix does this only when a `Trigger` is used; most
 * of our sheets and dialogs are opened from state and unmount on close, so the element focused
 * at first render is remembered and focused again on close and on unmount. When that is already
 * the page itself — the mini-cart opens after "Add to cart" has finished, and the disabled button
 * dropped focus meanwhile — the last element that had focus is used.
 */
export function useReturnFocus() {
  const [opener] = useState(() => {
    if (typeof document === 'undefined') return null;
    const active = document.activeElement as HTMLElement | null;
    return active && active !== document.body ? active : lastFocused();
  });
  const restore = () => {
    // Wait a frame so the overlay's own focus trap has let go.
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (opener?.isConnected && (!active || active === document.body)) opener.focus();
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => restore, []);
  return (e: Event) => {
    if (!opener?.isConnected) return;
    e.preventDefault();
    opener.focus();
  };
}
