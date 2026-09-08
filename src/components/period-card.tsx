import { useLayoutEffect, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Cite } from '@/components/citations';
import { owners, powerColor } from '@/lib/history';
import type { Inspection } from '@/lib/chart-inspection';
import type { Period } from '@/lib/periods';
import { onViewportChange } from '@/lib/utils';

export function PeriodCard({
  inspection,
  pinned,
  anchor,
  panelRef,
  onSelect,
  onShowIsland,
  onDismiss,
  onEnter,
  onLeave,
}: {
  inspection: Inspection | null;
  pinned: boolean;
  anchor: { getBoundingClientRect: () => DOMRect };
  panelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (period: Period) => void;
  onShowIsland?: () => void;
  onDismiss: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const event = inspection?.event;
  const claimedPlace = event?.title.match(
    /^(?:Spain|England|France) claims (.+)$/i,
  )?.[1];
  const repeatedClaimTitle =
    event?.kind === 'claim' &&
    (/^an? (?:English|Spanish|French) claim$/i.test(event.title) ||
      claimedPlace?.toLowerCase() === inspection?.island.name.toLowerCase() ||
      claimedPlace === 'the island');

  useLayoutEffect(() => {
    if (!inspection) return;
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      const panel = panelRef.current;
      const width = panel?.offsetWidth || 340;
      const height = panel?.offsetHeight || 300;
      const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - width - 12,
      );
      let top = rect.bottom + 10;
      if (top + height > window.innerHeight - 12) top = rect.top - height - 10;
      top = Math.max(12, top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) return;
      setPosition({ left, top });
    };
    update();
    return onViewportChange(update);
  }, [anchor, inspection, panelRef]);

  useEffect(() => {
    if (!inspection) return;
    const close = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || panelRef.current?.contains(target))
        return;
      if (
        target.closest('[data-period-id], [data-claim-id], #island-background')
      )
        return;
      onDismiss();
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [inspection, onDismiss, panelRef]);

  if (!inspection) return null;
  return (
    <div className="period-card-positioner" style={position}>
      <div
        id="period-metadata"
        ref={panelRef}
        className="period-card"
        data-pinned={pinned}
        style={{ borderInlineStartColor: powerColor(inspection.power) }}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onFocusCapture={onEnter}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            onLeave();
        }}
      >
        <div className="period-card-heading">
          <div className="period-card-title">
            <h3>{inspection.island.name}</h3>
            {onShowIsland && (
              <button
                type="button"
                className="period-card-isolate"
                aria-label={`Show only ${inspection.island.name}`}
                onClick={onShowIsland}
              >
                Show only this island
              </button>
            )}
          </div>
          <button
            type="button"
            className="period-card-close"
            aria-label="Close period details"
            onClick={onDismiss}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="period-card-meta">
          <strong>
            {event?.kind === 'claim' && 'Claim by '}
            {owners[inspection.power].label}
          </strong>
          <span>{inspection.dates}</span>
        </div>
        {event && !repeatedClaimTitle && <h4>{event.title}</h4>}
        <p id="period-metadata-description">
          {event?.detail || inspection.island.peoples}
        </p>
        {event?.uncertainty && (
          <p className="qualification">
            <span>Qualified change</span>
            {event.uncertainty}
          </p>
        )}
        {event?.qualification && (
          <p className="qualification">{event.qualification}</p>
        )}
        <div className="period-card-sources">
          <span>Sources</span>
          <Cite ids={event?.sources || inspection.island.sources} />
        </div>
        <div className="period-card-navigation">
          <span className="period-card-count">
            {inspection.index + 1} / {inspection.sequence.length}
          </span>
          <button
            type="button"
            disabled={inspection.index <= 0}
            onClick={() => onSelect(inspection.sequence[inspection.index - 1])}
            aria-label={`Previous period for ${inspection.island.name}`}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Previous
          </button>
          <button
            type="button"
            disabled={inspection.index >= inspection.sequence.length - 1}
            onClick={() => onSelect(inspection.sequence[inspection.index + 1])}
            aria-label={`Next period for ${inspection.island.name}`}
          >
            Next
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
