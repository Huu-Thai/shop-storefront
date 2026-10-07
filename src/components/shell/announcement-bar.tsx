import { themeConfig } from '@/theme/config';

/** Thin bar above the header for the store's current message (`announce.text`; CMS in Phase 4). */
export function AnnouncementBar({ message }: { message: string }) {
  if (!themeConfig.announcement || !message) return null;
  return (
    <div className="bg-announce-bg text-announce-fg">
      <p className="container-page flex min-h-[var(--announce-height)] items-center justify-center py-2 text-center text-caption font-medium tracking-wide">
        {message}
      </p>
    </div>
  );
}
