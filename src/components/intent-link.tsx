'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

/**
 * Link that prefetches on intent (hover, focus, touch) instead of on entering the viewport. A page
 * full of product cards and menu links would otherwise fire a burst of prefetches during load and
 * compete with hydration on phones; intent still gives an instant navigation.
 */
export function Link({
  href,
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof NextLink>) {
  const router = useRouter();
  const prefetch = () => {
    if (typeof href === 'string' && href.startsWith('/')) router.prefetch(href);
  };
  return (
    <NextLink
      href={href}
      prefetch={false}
      onPointerEnter={(e) => {
        prefetch();
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        prefetch();
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        prefetch();
        onTouchStart?.(e);
      }}
      {...props}
    />
  );
}
