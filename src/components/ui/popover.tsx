import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { cn, onViewportChange } from '@/lib/utils';

type PopoverState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
};
const PopoverContext = createContext<PopoverState | null>(null);

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        setOpen(false);
        rootRef.current
          ?.querySelector<HTMLButtonElement>('[data-slot="popover-trigger"]')
          ?.focus();
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <PopoverContext.Provider value={{ open, setOpen, contentId }}>
      <div
        ref={rootRef}
        className="popover-root"
        onBlur={(event) => {
          // A tap can blur to the document in WebKit; outside pointer presses
          // already dismiss the panel without racing the trigger's click.
          if (
            event.relatedTarget &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            setOpen(false);
        }}
      >
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
      data-slot="popover-trigger"
      aria-expanded={popover.open}
      aria-controls={popover.contentId}
      aria-haspopup="dialog"
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
  const panelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const trigger = panel
      ?.closest('.popover-root')
      ?.querySelector<HTMLElement>('[data-slot="popover-trigger"]');
    if (!panel || !trigger) return;
    const position = () => {
      const rect = trigger.getBoundingClientRect();
      const margin = 14;
      const gap = Number(panel.dataset.sideOffset || 8);
      const below = Math.max(
        0,
        window.innerHeight - rect.bottom - gap - margin,
      );
      const above = Math.max(0, rect.top - gap - margin);
      const naturalHeight = panel.scrollHeight + 2;
      const useBelow = naturalHeight <= below || below >= above;
      const available = Math.min(
        window.innerHeight - 2 * margin,
        Math.max(40, useBelow ? below : above),
      );
      const height = Math.min(naturalHeight, available);
      const left =
        panel.dataset.align === 'start'
          ? rect.left
          : rect.right - panel.offsetWidth;
      panel.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - panel.offsetWidth - margin))}px`;
      panel.style.top = `${Math.max(margin, useBelow ? rect.bottom + gap : rect.top - gap - height)}px`;
      panel.style.setProperty('--available-height', `${available}px`);
    };
    position();
    (
      panel?.querySelector<HTMLElement>(
        'button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), select:not(:disabled), a[href]',
      ) || panel
    )?.focus({ preventScroll: true });
    return onViewportChange(position);
  }, [popover?.open, align, sideOffset]);
  if (!popover?.open) return null;
  return (
    <div
      ref={panelRef}
      id={popover.contentId}
      role="dialog"
      aria-labelledby={`${popover.contentId}-title`}
      tabIndex={-1}
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

export const PopoverHeader = ({
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div className={cn('popover-header', className)} {...props} />
);

export function PopoverTitle({ className, ...props }: ComponentProps<'div'>) {
  const popover = useContext(PopoverContext);
  return (
    <div
      id={popover ? `${popover.contentId}-title` : undefined}
      role="heading"
      aria-level={3}
      className={cn('popover-title', className)}
      {...props}
    />
  );
}

export const PopoverDescription = ({
  className,
  ...props
}: ComponentProps<'p'>) => (
  <p className={cn('popover-description', className)} {...props} />
);
