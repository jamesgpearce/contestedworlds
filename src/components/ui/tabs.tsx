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

export function TabsList({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn('tabs-list', className)}
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
