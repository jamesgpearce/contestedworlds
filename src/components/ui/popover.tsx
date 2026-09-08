import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { cn } from '@/lib/utils';

type PopoverState = { open: boolean; setOpen: (open: boolean) => void };
const PopoverContext = createContext<PopoverState | null>(null);

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="popover-root">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  className,
  onClick,
  ...props
}: ComponentProps<'button'>) {
  const popover = useContext(PopoverContext);
  if (!popover) throw new Error('PopoverTrigger must be used inside Popover');
  return (
    <button
      type="button"
      data-popup-open={popover.open || undefined}
      className={className}
      onClick={(event) => {
        popover.setOpen(!popover.open);
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export function PopoverContent({
  className,
  children,
  align,
  sideOffset,
  ...props
}: ComponentProps<'div'> & {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}) {
  const popover = useContext(PopoverContext);
  if (!popover?.open) return null;
  return (
    <div
      data-slot="popover-content"
      data-align={align}
      data-side-offset={sideOffset}
      className={cn('popover-content', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('popover-header', className)} {...props} />;
}

export function PopoverTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="heading"
      aria-level={3}
      className={cn('popover-title', className)}
      {...props}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: ComponentProps<'p'>) {
  return <p className={cn('popover-description', className)} {...props} />;
}
