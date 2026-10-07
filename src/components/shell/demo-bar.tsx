import { connection } from 'next/server';
import { isDemo } from '@/server/env';
import type { Translate } from '@/i18n';
import { AccentSwitch } from './accent-switch';

/**
 * Demo-mode strip above the announcement bar (DEMO_MODE=true): says what is switched off and lets a
 * visitor try the accent presets. It reads the environment per request, so the cached pages stay
 * the same in every deployment; outside demo mode it renders nothing.
 */
export async function DemoBar({ t }: { t: Translate }) {
  await connection();
  if (!isDemo()) return null;
  return (
    <aside aria-label={t('demo.label')} className="border-b border-border bg-surface-muted text-fg">
      <div className="container-page flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-1.5">
        <p className="text-caption font-medium">
          <span className="mr-2 rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-fg uppercase">
            {t('demo.badge')}
          </span>
          {t('demo.message')}
        </p>
        <AccentSwitch label={t('demo.accent')} />
      </div>
    </aside>
  );
}
