/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG periods use roving keyboard focus; native previous/next buttons provide the same navigation. */
'use client';
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, Diamond } from 'lucide-react';
import {
  type Island,
  type HistoryEvent,
  type Mode,
  data,
  owners,
  dateValue,
  eventDate,
  powerColor,
} from '@/lib/history';
import {
  periodsFor,
  arrangePeriods,
  plottedEvent,
  type Period,
  type Arrangement,
  type Placement,
} from '@/lib/periods';
import { eventAxis } from '@/lib/event-axis';
import { PowerSymbol } from '@/components/power-symbol';

type Frame = {
  positions: Record<string, Placement>;
  height: number;
  connectors: number;
};
function useMovingPeriods(target: Frame, arrangement: Arrangement) {
  const [frame, setFrame] = useState(target);
  const displayed = useRef(target);
  const first = useRef(true);
  const previousArrangement = useRef(arrangement);
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let request = 0;
    const stop = () => {
      cancelAnimationFrame(request);
      displayed.current = target;
      setFrame(target);
    };
    const regrouping = previousArrangement.current !== arrangement;
    previousArrangement.current = arrangement;
    if (first.current || reduce.matches || !regrouping) {
      first.current = false;
      stop();
      return;
    }
    const from = displayed.current,
      start = performance.now();
    const step = (time: number) => {
      const t = Math.min(1, (time - start) / 620),
        ease = t * t * (3 - 2 * t);
      const positions: Record<string, Placement> = {};
      for (const [id, end] of Object.entries(target.positions)) {
        const begin = from.positions[id] || end;
        positions[id] = {
          y: begin.y + (end.y - begin.y) * ease,
          height: begin.height + (end.height - begin.height) * ease,
        };
      }
      const next = {
        positions,
        height: from.height + (target.height - from.height) * ease,
        connectors:
          from.connectors + (target.connectors - from.connectors) * ease,
      };
      displayed.current = next;
      setFrame(next);
      if (t < 1) request = requestAnimationFrame(step);
    };
    request = requestAnimationFrame(step);
    reduce.addEventListener('change', stop);
    return () => {
      cancelAnimationFrame(request);
      reduce.removeEventListener('change', stop);
    };
  }, [target, arrangement]);
  return frame;
}

function periodDates(p: Period, range: [number, number]) {
  const start = p.event ? eventDate(p.event) : `Before ${range[0]}`;
  return `${start} – ${p.endEvent ? eventDate(p.endEvent) : Math.floor(p.end)}`;
}

export function HistoryChart({
  tracks,
  mode,
  range,
  arrangement,
  spacing,
  scale,
  showClaims,
  inspectedId,
  eventId,
  year,
  onSelect,
  onClaim,
}: {
  tracks: Island[];
  mode: Mode;
  range: [number, number];
  arrangement: Arrangement;
  spacing: string;
  scale: ReturnType<typeof eventAxis>;
  showClaims: boolean;
  inspectedId: string;
  eventId: string;
  year: number;
  onSelect: (period: Period) => void;
  onClaim: (island: Island, event: HistoryEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pointerWithin, setPointerWithin] = useState(false);
  const [previewScope, setPreviewScope] = useState('');
  const scope = [
    arrangement,
    spacing,
    mode,
    ...range,
    ...tracks.map((i) => i.id),
  ].join('/');
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const periods = useMemo(
    () => tracks.flatMap((i) => periodsFor(i, mode, range)),
    [tracks, mode, range],
  );
  const layout = useMemo(
    () =>
      arrangePeriods(
        periods,
        tracks.map((i) => i.id),
        data.owners.map((o) => o.id),
        width,
        arrangement,
      ),
    [periods, tracks, width, arrangement],
  );
  const target = useMemo(
    () => ({
      positions: layout.positions,
      height: layout.height,
      connectors: arrangement === 'powers' ? 1 : 0,
    }),
    [layout, arrangement],
  );
  const frame = useMovingPeriods(target, arrangement);
  const changing = Math.abs(frame.connectors - target.connectors) > 0.001;
  const plotWidth = Math.max(1, width - layout.left - layout.right);
  const x = (date: number) =>
    layout.left +
    (spacing === 'events'
      ? scale.position(date)
      : (date - range[0]) / (range[1] - range[0])) *
      plotWidth;
  const preview =
    pointerWithin && !changing && previewScope === scope
      ? periods.find((p) => p.id === previewId)
      : undefined;
  const inspected =
    periods.find(
      (p) => p.islandId === inspectedId && p.event?.id === eventId,
    ) ||
    periods.find(
      (p) => p.islandId === inspectedId && p.start <= year && p.end > year,
    ) ||
    periods.filter((p) => p.islandId === inspectedId).at(-1);
  const current = tracks.find((i) => i.id === inspectedId) || tracks[0];
  const sequence = periods.filter((p) => p.islandId === inspectedId);
  const index = sequence.findIndex((p) => p.id === inspected?.id);
  const selectedRecord = current.events.find((e) => e.id === eventId);
  const selectedClaim =
    selectedRecord?.kind === 'claim' ? selectedRecord : undefined;
  const standaloneEvent =
    selectedRecord && !plottedEvent(selectedRecord, mode)
      ? selectedRecord
      : undefined;
  const years = [range[0]];
  const tickStep =
    [25, 50, 100, 200, 500].find(
      (n) => (n / (range[1] - range[0])) * plotWidth >= 60,
    ) || 500;
  for (
    let n = Math.ceil(range[0] / tickStep) * tickStep;
    n < range[1];
    n += tickStep
  )
    if (x(n) - x(range[0]) >= 58 && x(range[1]) - x(n) >= 58) years.push(n);
  years.push(range[1]);
  const ticks = spacing === 'events' ? scale.labels(plotWidth, 64) : years;
  const claims = showClaims
    ? tracks.flatMap((island) =>
        island.events
          .filter(
            (e) =>
              e.kind === 'claim' &&
              dateValue(e.date) >= range[0] &&
              dateValue(e.date) <= range[1],
          )
          .map((event) => ({ island, event })),
      )
    : [];
  const readoutEvent = standaloneEvent || inspected?.event;
  const displayPower = selectedClaim?.claimant || inspected?.power;
  const select = (p: Period) => {
    setPreviewId(null);
    setPointerWithin(false);
    onSelect(p);
  };
  const keyboard = (e: React.KeyboardEvent<SVGGElement>, p: Period) => {
    const route = periods.filter((q) => q.islandId === p.islandId),
      n = route.indexOf(p);
    let next: Period | undefined;
    if (e.key === 'ArrowRight') next = route[Math.min(n + 1, route.length - 1)];
    else if (e.key === 'ArrowLeft') next = route[Math.max(0, n - 1)];
    else if (e.key === 'Home') next = route[0];
    else if (e.key === 'End') next = route.at(-1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const index = tracks.findIndex((i) => i.id === p.islandId);
      const island =
        tracks[
          Math.max(
            0,
            Math.min(tracks.length - 1, index + (e.key === 'ArrowUp' ? -1 : 1)),
          )
        ];
      next =
        periods.find(
          (q) =>
            q.islandId === island.id && q.start <= p.start && q.end > p.start,
        ) || periods.find((q) => q.islandId === island.id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(p);
      return;
    } else if (e.key === 'Escape') {
      setPointerWithin(false);
      setPreviewId(null);
      return;
    }
    if (next) {
      e.preventDefault();
      select(next);
      ref.current
        ?.querySelector<SVGGElement>(`[data-period-id="${next.id}"]`)
        ?.focus();
    }
  };
  const claimSpots: { x: number; y: number }[] = [];
  return (
    <div className="period-atlas" ref={ref}>
      <div className="chart-preview-anchor" aria-hidden="true">
        {preview && (
          <div
            className="chart-preview"
            style={{ borderInlineEndColor: powerColor(preview.power) }}
          >
            <strong>
              Preview period ·{' '}
              {tracks.find((i) => i.id === preview.islandId)?.name}
            </strong>
            <span>
              {owners[preview.power].label} · {periodDates(preview, range)}
            </span>
          </div>
        )}
      </div>
      <div
        className="period-canvas"
        style={{ height: frame.height }}
        onPointerLeave={() => {
          setPointerWithin(false);
          setPreviewId(null);
        }}
      >
        <svg
          className="period-chart"
          width={width}
          height={frame.height}
          role="group"
          aria-label={`${tracks.length} selected island histories, grouped by ${arrangement}. ${spacing === 'events' ? 'Equal spacing between selected event dates.' : 'Linear time.'}`}
        >
          <desc>
            Rectangles represent periods of{' '}
            {mode === 'administration' ? 'administration' : 'sovereign status'}.
            Color identifies the power. Use left and right arrow keys on a
            period, up and down to change islands, or the previous and next
            buttons below. Vertical distance and rectangle height do not measure
            population, area, or importance.
          </desc>
          {ticks.map((t) => (
            <g key={t} aria-hidden="true">
              <text
                x={x(t)}
                y={18}
                textAnchor={
                  t === range[0] ? 'start' : t === range[1] ? 'end' : 'middle'
                }
                className="period-tick"
              >
                {Math.floor(t)}
              </text>
              <path
                d={`M${x(t)} 28V${frame.height - 8}`}
                stroke="var(--border)"
                strokeWidth=".6"
                strokeDasharray="2 5"
                opacity=".65"
              />
            </g>
          ))}
          {spacing === 'events' &&
            scale.domain.map((t) => (
              <path
                key={t}
                d={`M${x(t)} 24v4`}
                stroke="var(--border-strong)"
                aria-hidden="true"
              />
            ))}
          {layout.rows.map((row) => (
            <line
              key={row.id}
              x1={layout.left}
              x2={width - layout.right}
              y1={row.bottom}
              y2={row.bottom}
              stroke="var(--border)"
              opacity=".6"
              aria-hidden="true"
            />
          ))}
          <g
            className="period-connectors"
            aria-hidden="true"
            opacity={frame.connectors}
          >
            {tracks.flatMap((i) => {
              const route = periods.filter((p) => p.islandId === i.id);
              return route.slice(1).map((p, n) => {
                const previous = route[n],
                  a = frame.positions[previous.id],
                  b = frame.positions[p.id];
                if (!a || !b) return null;
                const xx = x(p.start),
                  y1 = a.y + a.height / 2,
                  y2 = b.y + b.height / 2;
                const bend = Math.min(
                  8,
                  (x(previous.end) - x(previous.start)) / 2,
                  (x(p.end) - x(p.start)) / 2,
                );
                return (
                  <path
                    key={p.id}
                    d={`M${xx - bend},${y1} C${xx + bend},${y1} ${xx - bend},${y2} ${xx + bend},${y2}`}
                    fill="none"
                    stroke={powerColor(p.power)}
                    strokeWidth={preview?.islandId === p.islandId ? 1.8 : 1.1}
                    opacity={
                      preview
                        ? preview.islandId === p.islandId
                          ? 1
                          : 0.12
                        : 0.65
                    }
                  />
                );
              });
            })}
          </g>
          {periods.map((p) => {
            const pos = frame.positions[p.id] || layout.positions[p.id];
            const selected = p.id === inspected?.id && !selectedClaim;
            const name = tracks.find((i) => i.id === p.islandId)!.name;
            return (
              <g
                key={p.id}
                data-period-id={p.id}
                transform={`translate(0 ${pos.y})`}
                className="period-mark"
                role="button"
                tabIndex={selected ? 0 : -1}
                aria-label={`${name}. ${owners[p.power].label}. ${periodDates(p, range)}.${p.event ? ' ' + p.event.title : ''}`}
                aria-pressed={selected}
                onKeyDown={(e) => keyboard(e, p)}
                onClick={() => select(p)}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch') {
                    setPointerWithin(true);
                    setPreviewScope(scope);
                    setPreviewId(p.id);
                  }
                }}
                onPointerLeave={() => {
                  setPointerWithin(false);
                  setPreviewId(null);
                }}
              >
                <rect
                  x={x(p.start)}
                  y={0}
                  width={Math.max(0, x(p.end) - x(p.start))}
                  height={pos.height}
                  fill={powerColor(p.power)}
                  opacity={
                    preview && preview.islandId !== p.islandId ? 0.25 : 1
                  }
                />
                {p.start === p.end && (
                  <line
                    x1={x(p.start)}
                    x2={x(p.start)}
                    y1={-2}
                    y2={pos.height + 2}
                    stroke={powerColor(p.power)}
                    strokeWidth="1.5"
                  />
                )}
                {p.event && (
                  <line
                    x1={x(p.start)}
                    x2={x(p.start)}
                    y1="0"
                    y2={pos.height}
                    stroke="var(--paper)"
                    strokeWidth=".8"
                  />
                )}
                {p.event?.uncertainty && (
                  <circle
                    cx={x(p.start)}
                    cy={pos.height / 2}
                    r="2.7"
                    fill="var(--paper)"
                    stroke="var(--ink)"
                    strokeWidth="1"
                  />
                )}
                {selected && (
                  <path
                    d={`M${x(p.start) - 3},${pos.height + 7} l3,-4 l3,4`}
                    fill="var(--ink)"
                  />
                )}
                <rect
                  x={x(p.start)}
                  y={-3}
                  width={Math.max(1, x(p.end) - x(p.start))}
                  height={pos.height + 6}
                  fill="transparent"
                />
              </g>
            );
          })}
          {claims.map(({ island, event }) => {
            const t = dateValue(event.date),
              p = periods.find(
                (p) => p.islandId === island.id && p.start <= t && p.end >= t,
              );
            if (!p) return null;
            const pos = frame.positions[p.id] || layout.positions[p.id];
            const xx = x(t);
            let yy = pos.y - 7,
              slot = 0;
            // Nearby claims remain independently selectable even on a compressed time axis.
            while (
              claimSpots.some(
                (s) => Math.abs(s.x - xx) < 12 && Math.abs(s.y - yy) < 12,
              )
            ) {
              slot++;
              yy =
                slot % 2
                  ? pos.y + pos.height + 7 + Math.floor(slot / 2) * 12
                  : pos.y - 7 - Math.floor(slot / 2) * 12;
            }
            claimSpots.push({ x: xx, y: yy });
            return (
              <g
                key={event.id}
                className="claim-mark"
                role="button"
                tabIndex={0}
                aria-label={`${island.name}. Claim only. ${eventDate(event)}. ${event.title}`}
                onClick={() => onClaim(island, event)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClaim(island, event);
                  }
                }}
              >
                <path
                  d={`M${xx} ${yy - 3}l3 3 -3 3 -3 -3z`}
                  fill="var(--paper)"
                  stroke={powerColor(event.claimant || p.power)}
                />
                <circle cx={xx} cy={yy} r="5" fill="transparent" />
              </g>
            );
          })}
          {year >= range[0] && year <= range[1] && (
            <line
              x1={x(year)}
              x2={x(year)}
              y1="28"
              y2={frame.height - 8}
              stroke="var(--ink)"
              strokeDasharray="3 5"
              strokeWidth=".7"
              opacity=".3"
              pointerEvents="none"
              aria-hidden="true"
            />
          )}
        </svg>
        <div
          className="period-row-labels"
          aria-hidden="true"
          style={{ opacity: changing ? 0 : 1 }}
        >
          {layout.rows.map((row) => (
            <div
              key={`${arrangement}:${row.id}`}
              className={`period-row-label ${layout.compact ? 'above-row' : ''}`}
              style={{
                top: row.labelY,
                width: layout.compact ? width - 16 : layout.left - 16,
              }}
            >
              {arrangement === 'powers' ? (
                <>
                  <svg width="22" height="17" viewBox="0 0 22 17">
                    <PowerSymbol id={row.id} />
                  </svg>
                  <span>{owners[row.id].label}</span>
                </>
              ) : (
                <span>{tracks.find((i) => i.id === row.id)?.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="period-key" aria-label="Power colors">
        {data.owners
          .filter((o) => periods.some((p) => p.power === o.id))
          .map((o) => (
            <span key={o.id}>
              <i style={{ background: powerColor(o.id) }} />
              {o.label}
            </span>
          ))}
        <span className="marker-key">
          <i className="uncertain-key" />
          Qualified change
        </span>
        {showClaims && (
          <span>
            <Diamond size={10} aria-hidden="true" /> Claim only
          </span>
        )}
      </div>
      {inspected && (
        <div className="period-readout" aria-live="polite" aria-atomic="true">
          <div className="readout-heading">
            <span>
              {selectedClaim
                ? 'Selected claim'
                : standaloneEvent
                  ? 'Selected event'
                  : 'Selected period'}{' '}
              · <strong>{current.name}</strong>
            </span>
            <span>
              {standaloneEvent
                ? eventDate(standaloneEvent)
                : periodDates(inspected, range)}
            </span>
          </div>
          <div className="readout-body">
            <i
              className="readout-swatch"
              style={{ background: powerColor(displayPower!) }}
            />
            <div>
              <strong>{owners[displayPower!].label}</strong>
              {readoutEvent && <span> · {readoutEvent.title}</span>}
              <p>{readoutEvent?.detail || current.notes}</p>
            </div>
          </div>
          <div className="period-navigation">
            <a href={readoutEvent ? '#selected-event' : '#island-background'}>
              Sources &amp; context <ArrowDown size={14} aria-hidden="true" />
            </a>
            <span>
              {index + 1} / {sequence.length} periods
            </span>
            <button
              disabled={index <= 0}
              onClick={() => select(sequence[index - 1])}
              aria-label={`Previous period for ${current.name}`}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Previous
            </button>
            <button
              disabled={index >= sequence.length - 1}
              onClick={() => select(sequence[index + 1])}
              aria-label={`Next period for ${current.name}`}
            >
              Next
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
