'use client';
import { useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  getThemePreference,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '@/lib/theme';

const choices = [
  { value: 'system', label: 'Follow system', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];
export function ThemeSwitcher() {
  const selected = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    () => 'system',
  );
  const choice = choices.find((c) => c.value === selected)!;
  const Icon = choice.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="theme-trigger"
        aria-label={`Appearance: ${choice.label}`}
        title={`Appearance: ${choice.label}`}
      >
        <Icon size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="theme-menu"
        align="end"
        aria-label="Appearance"
      >
        <DropdownMenuRadioGroup
          value={selected}
          onValueChange={(v) => setThemePreference(v as ThemePreference)}
        >
          {choices.map(({ value, label, icon: ChoiceIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <ChoiceIcon size={16} aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
