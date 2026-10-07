'use client';

import { useEffect, useState } from 'react';
import type { LineCard } from '@/app/api/catalog/cards/route';

export type { LineCard };

/** Cards already fetched, per ctx: the cart, drawer and checkout share them. */
const cache = new Map<string, LineCard>();

/**
 * Names, links, images and option labels for cart / order lines (the cart carries only ids and
 * SKUs). One request for whatever isn't known yet.
 */
export function useLineCards(ctx: string, productIds: string[]): Record<string, LineCard> {
  const key = [...new Set(productIds)].sort().join(',');
  const [, rerender] = useState(0);
  useEffect(() => {
    const missing = key.split(',').filter((id) => id && !cache.has(`${ctx}|${id}`));
    if (!missing.length) return;
    let live = true;
    fetch(`/api/catalog/cards?ids=${missing.join(',')}`, { headers: { 'x-sf-ctx': ctx } })
      .then((r) => (r.ok ? (r.json() as Promise<LineCard[]>) : []))
      .then((cards) => {
        for (const c of cards) cache.set(`${ctx}|${c.id}`, c);
        if (live) rerender((n) => n + 1);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [ctx, key]);
  return Object.fromEntries(
    key
      .split(',')
      .filter(Boolean)
      .map((id) => [id, cache.get(`${ctx}|${id}`)])
      .filter((e): e is [string, LineCard] => !!e[1]),
  );
}

/** "Colour: Black · Size: M" from a line's option codes. */
export function describeAttributes(attributes: Record<string, unknown>, card?: LineCard): string {
  return Object.entries(attributes)
    .map(([code, value]) => {
      const o = card?.options[code];
      const v = String(value);
      return `${o?.label ?? code}: ${o?.values[v] ?? v.toUpperCase()}`;
    })
    .join(' · ');
}
