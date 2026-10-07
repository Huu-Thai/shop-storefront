'use client';

import { useSyncExternalStore } from 'react';
import { PRESET_STORAGE } from '@/lib/preferences';
import { cn } from '@/lib/cn';
import { themeConfig } from '@/theme/config';

const subscribe = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
};

/**
 * Accent preset picker: swaps `data-theme` on <html> and remembers it in local storage (the theme
 * script re-applies it before paint). Shown in demo mode and in the style guide only — a live
 * store keeps one brand colour.
 */
export function AccentSwitch({ label }: { label: string }) {
  const preset = useSyncExternalStore(
    subscribe,
    () => document.documentElement.getAttribute('data-theme') ?? themeConfig.defaultPreset,
    () => themeConfig.defaultPreset,
  );
  const choose = (id: string) => {
    if (id === themeConfig.defaultPreset) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', id);
    try {
      localStorage.setItem(PRESET_STORAGE, id);
    } catch {}
  };
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-border p-0.5">
      {themeConfig.presets.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-label={p.label}
          aria-pressed={preset === p.id}
          onClick={() => choose(p.id)}
          className={cn(
            'focus-ring flex size-7 items-center justify-center rounded-full sm:size-8',
            preset === p.id && 'bg-surface-sunken',
          )}
        >
          <span
            className="size-4 rounded-full border border-border-strong"
            style={{ background: p.swatch }}
          />
        </button>
      ))}
    </div>
  );
}
