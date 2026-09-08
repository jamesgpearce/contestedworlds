export type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'caribbean-atlas-theme';
const changeEvent = 'atlas-theme-change';

const preference = (value: unknown): ThemePreference =>
  value === 'light' || value === 'dark' ? value : 'system';

// Restore appearance before React renders the atlas.
export function initializeTheme() {
  let saved: ThemePreference = 'system';
  try {
    saved = preference(window.localStorage.getItem(storageKey));
  } catch {
    // System appearance still works when storage is unavailable.
  }
  applyTheme(saved);
}

export const getThemePreference = (): ThemePreference =>
  typeof document === 'undefined'
    ? 'system'
    : preference(document.documentElement.dataset.themePreference);

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
