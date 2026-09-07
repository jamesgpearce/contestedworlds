'use client';
import { useSyncExternalStore } from 'react';
import { Moon, Sun, SunMoon } from 'lucide-react';
import {
  getThemePreference,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '@/lib/theme';

const choices: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Auto', icon: SunMoon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];
export function ThemeSwitcher() {
  const selected = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    () => 'system',
  );
  const index = choices.findIndex((c) => c.value === selected);
  const choice = choices[index];
  const next = choices[(index + 1) % choices.length];
  const Icon = choice.icon;
  return (
    <button
      type="button"
      className="theme-trigger"
      aria-label={`Appearance: ${choice.label}. Switch to ${next.label}`}
      title={`Appearance: ${choice.label}. Switch to ${next.label}`}
      onClick={() => setThemePreference(next.value)}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
