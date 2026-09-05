'use client';
import { useSyncExternalStore } from 'react';
import {
  getThemePreference,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '@/lib/theme';

const choices: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSwitcher() {
  const selected = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    () => 'system',
  );
  return (
    <fieldset className="theme-switcher">
      <legend className="sr-only">Display appearance</legend>
      {choices.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-label={
            value === 'system'
              ? 'Follow system appearance'
              : `Use ${value} appearance`
          }
          aria-pressed={selected === value}
          onClick={() => setThemePreference(value)}
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}
