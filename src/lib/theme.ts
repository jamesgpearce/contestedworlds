export type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'caribbean-atlas-theme';
const changeEvent = 'atlas-theme-change';

function preference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

// Runs in the document head, before the page paints or React hydrates.
export const themeBootstrap = `(()=>{let p='system';try{const v=localStorage.getItem('caribbean-atlas-theme');if(v==='light'||v==='dark')p=v}catch{}const d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);const r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=d?'dark':'light';r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'})()`;

export function getThemePreference(): ThemePreference {
  return typeof document === 'undefined'
    ? 'system'
    : preference(document.documentElement.dataset.themePreference);
}

function applyTheme(value: ThemePreference) {
  const dark =
    value === 'dark' ||
    (value === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.dataset.themePreference = value;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

export function setThemePreference(value: ThemePreference) {
  applyTheme(value);
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    /* The choice still works when storage is unavailable. */
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeTheme(notify: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (getThemePreference() === 'system') applyTheme('system');
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      applyTheme(preference(event.newValue));
      notify();
    }
  };
  window.addEventListener(changeEvent, notify);
  window.addEventListener('storage', onStorage);
  media.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener(changeEvent, notify);
    window.removeEventListener('storage', onStorage);
    media.removeEventListener('change', onSystemChange);
  };
}
