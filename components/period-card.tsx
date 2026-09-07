'use client';
import { Popover } from '@base-ui/react/popover';
import { ArrowLeft, ArrowRight, Pin, X } from 'lucide-react';
import { Cite } from '@/components/citations';
import { owners, powerColor } from '@/lib/history';
import type { Inspection } from '@/lib/chart-inspection';
import type { Period } from '@/lib/periods';

export function PeriodCard({
  inspection,
  pinned,
  anchor,
  panelRef,
  onPin,
  onSelect,
  onDismiss,
  onEnter,
  onLeave,
}: {
  inspection: Inspection | null;
  pinned: boolean;
  anchor: Popover.Positioner.Props['anchor'];
  panelRef: React.RefObject<HTMLDivElement | null>;
  onPin: () => void;
  onSelect: (period: Period) => void;
  onDismiss: (restoreFocus?: boolean) => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <Popover.Root
      open={!!inspection}
      modal={false}
      onOpenChange={(open, details) => {
        if (open) return;
        const target = details.event.target;
        // Rectangle clicks replace the pinned target; the About section belongs to it.
        if (
          details.reason === 'focus-out' ||
          (target instanceof Element &&
            target.closest(
              '[data-period-id], [data-claim-id], #island-background',
            ))
        ) {
          details.cancel();
          return;
        }
        onDismiss(details.reason === 'escape-key');
      }}
    >
      <Popover.Portal>
        <Popover.Positioner
          anchor={anchor}
          side="bottom"
          align="start"
          sideOffset={10}
          positionMethod="fixed"
          collisionPadding={{ top: 120, right: 12, bottom: 12, left: 12 }}
          collisionAvoidance={{
            side: 'flip',
            align: 'shift',
            fallbackAxisSide: 'none',
          }}
          className="period-card-positioner"
        >
          <Popover.Popup
            id="period-metadata"
            ref={panelRef}
            className="period-card"
            initialFocus={false}
            finalFocus={false}
            data-pinned={pinned}
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            onFocusCapture={onEnter}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                onLeave();
            }}
            style={
              inspection
                ? { borderInlineStartColor: powerColor(inspection.power) }
                : undefined
            }
          >
            {inspection && (
              <>
                <div className="period-card-heading">
                  <Popover.Title>{inspection.island.name}</Popover.Title>
                  <button
                    className="period-card-close"
                    aria-label="Close period details"
                    onClick={() => onDismiss(true)}
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                </div>
                <div className="period-card-meta">
                  <strong>{owners[inspection.power].label}</strong>
                  <span>{inspection.dates}</span>
                </div>
                {inspection.event && <h4>{inspection.event.title}</h4>}
                <Popover.Description id="period-metadata-description">
                  {inspection.event?.detail || inspection.island.peoples}
                </Popover.Description>
                {inspection.event?.uncertainty && (
                  <p className="qualification">
                    <span>Evidence note</span>
                    {inspection.event.uncertainty}
                  </p>
                )}
                {inspection.event?.qualification && (
                  <p className="qualification">
                    {inspection.event.qualification}
                  </p>
                )}
                <div className="period-card-sources">
                  <span>Sources</span>
                  <Cite
                    ids={inspection.event?.sources || inspection.island.sources}
                  />
                </div>
                <div className="period-card-navigation">
                  <div className="period-card-pin">
                    {pinned ? (
                      <span className="period-card-pinned">
                        <Pin size={13} aria-hidden="true" />
                        Pinned
                      </span>
                    ) : (
                      <button onClick={onPin} data-panel-primary>
                        <Pin size={13} aria-hidden="true" />
                        Pin details
                      </button>
                    )}
                  </div>
                  <span className="period-card-count">
                    {inspection.index + 1} / {inspection.sequence.length}
                  </span>
                  <button
                    disabled={inspection.index <= 0}
                    onClick={() =>
                      onSelect(inspection.sequence[inspection.index - 1])
                    }
                    aria-label={`Previous period for ${inspection.island.name}`}
                  >
                    <ArrowLeft size={15} aria-hidden="true" />
                    Previous
                  </button>
                  <button
                    disabled={
                      inspection.index >= inspection.sequence.length - 1
                    }
                    onClick={() =>
                      onSelect(inspection.sequence[inspection.index + 1])
                    }
                    aria-label={`Next period for ${inspection.island.name}`}
                  >
                    Next
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
