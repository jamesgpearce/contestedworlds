import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = { value?: string; setValue: (value: string) => void };
const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: ComponentProps<'div'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = value ?? uncontrolledValue;
  const setValue = (nextValue: string) => {
    setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };
  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={cn('tabs', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  onKeyDown,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      role="tablist"
      tabIndex={-1}
      data-slot="tabs-list"
      className={cn('tabs-list', className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
        )
          return;
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]:not(:disabled)',
          ),
        );
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (index < 0) return;
        event.preventDefault();
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (index +
                  (event.key === 'ArrowRight' ? 1 : -1) +
                  buttons.length) %
                buttons.length;
        buttons[next].focus();
        buttons[next].click();
      }}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: ComponentProps<'button'> & { value: string }) {
  const tabs = useContext(TabsContext);
  if (!tabs) throw new Error('TabsTrigger must be used inside Tabs');
  const active = tabs.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      data-slot="tabs-trigger"
      data-active={active || undefined}
      className={cn('tabs-trigger', className)}
      onClick={() => tabs.setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  ...props
}: ComponentProps<'div'> & { value: string }) {
  const tabs = useContext(TabsContext);
  return (
    <div
      role="tabpanel"
      hidden={tabs?.value !== value}
      data-slot="tabs-content"
      className={cn('tabs-content', className)}
      {...props}
    />
  );
}

export function tabsListVariants() {
  return 'tabs-list';
}
