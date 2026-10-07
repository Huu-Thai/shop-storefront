import { MODE_STORAGE, PRESET_STORAGE } from '@/lib/preferences';
import { themeConfig } from '@/theme/config';

/**
 * Applies the shopper's colour mode and accent preset before first paint (no flash), from local
 * storage — so cached pages never depend on cookies. Defaults come from src/theme/config.ts.
 */
export function ThemeScript() {
  const presets = themeConfig.presets.map((p) => p.id);
  const js = `(function(){try{var d=document.documentElement,m=localStorage.getItem(${JSON.stringify(
    MODE_STORAGE,
  )})||${JSON.stringify(themeConfig.defaultMode)},p=localStorage.getItem(${JSON.stringify(
    PRESET_STORAGE,
  )})||${JSON.stringify(themeConfig.defaultPreset)};if(m==='system')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.classList.toggle('dark',m==='dark');if(${JSON.stringify(
    presets,
  )}.indexOf(p)>0)d.setAttribute('data-theme',p);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
