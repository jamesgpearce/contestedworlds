import type { ComponentProps } from 'react';

export function Checkbox({
  className = '',
  checked,
  onCheckedChange,
  ...props
}: Omit<ComponentProps<'input'>, 'type' | 'checked' | 'onChange'> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <input
      {...props}
      type="checkbox"
      data-slot="checkbox"
      className={className}
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
    />
  );
}
