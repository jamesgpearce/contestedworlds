/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG periods use roving keyboard focus; native previous/next buttons provide the same navigation. */
'use client';
import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from 'react';
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
  periodDates,
  arrangePeriods,
  type Period,
  type Arrangement,
  type Placement,
} from '@/lib/periods';
import { eventAxis } from '@/lib/event-axis';
import { PeriodCard } from '@/components/period-card';
import { inspectTarget, type InspectionTarget } from '@/lib/chart-inspection';
import { withinCardCorridor, type Point } from '@/lib/pointer-corridor';
import { PowerSymbol } from '@/components/power-symbol';

// Selection markers and enlarged hit areas must not move the card's anchor.
function periodBounds(element: SVGGraphicsElement) {
  return (
    element.querySelector<SVGGraphicsElement>('[data-period-body]') || element
  ).getBoundingClientRect();
}

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

export function HistoryChart({
  tracks,
  mode,
  range,
  arrangement,
  spacing,
  scale,
  showClaims,
  showQualified,
  inspectedId,
  eventId,
  year,
  pinned,
  focusRequest,
  onDismiss,
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
  showQualified: boolean;
  inspectedId: string;
  eventId: string;
  year: number;
  pinned: boolean;
  focusRequest: number;
  onDismiss: () => void;
  onSelect: (period: Period) => void;
  onClaim: (island: Island, event: HistoryEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreFocus = useRef(false);
  const pointerTransit = useRef<{ origin: Point; scope: string } | null>(null);
  const lastFocusRequest = useRef(0);
  const [hover, setHover] = useState<{
    target: InspectionTarget;
    scope: string;
  } | null>(null);
  const [focusId, setFocusId] = useState('');
  const scope = [
    arrangement,
    spacing,
    mode,
    showClaims,
    ...range,
    ...tracks.map((i) => i.id),
  ].join('/');
  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
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
  const inspection = inspectTarget(
    pinned
      ? { islandId: inspectedId, eventId, year }
      : hover?.scope === scope && !changing
        ? hover.target
        : null,
    tracks,
    periods,
    mode,
    range,
  );
  const activeIsland = inspection?.island.id;
  const anchorKey = inspection
    ? inspection.standalone?.kind === 'claim' && showClaims
      ? `claim:${inspection.standalone.id}`
      : `period:${inspection.period.id}`
    : '';
  const getAnchorElement = useCallback(
    () =>
      ref.current?.querySelector<SVGGraphicsElement>(
        anchorKey.startsWith('claim:')
          ? `[data-claim-id="${anchorKey.slice(6)}"]`
          : `[data-period-id="${anchorKey.slice(7)}"]`,
      ),
    [anchorKey],
  );
  // A new virtual anchor updates Base UI when the inspected rectangle changes.
  const anchor = useMemo(
    () => ({
      get contextElement() {
        return getAnchorElement() || undefined;
      },
      getBoundingClientRect() {
        const element = getAnchorElement();
        const bounds = element && periodBounds(element);
        return bounds || new DOMRect();
      },
    }),
    [getAnchorElement],
  );
  useEffect(() => {
    if (!focusRequest || focusRequest === lastFocusRequest.current) return;
    const element = getAnchorElement();
    if (!element) return;
    lastFocusRequest.current = focusRequest;
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    element.focus({ preventScroll: true });
  }, [focusRequest, getAnchorElement]);
  const dismiss = (restoreFocus = false) => {
    pointerTransit.current = null;
    cancelClose();
    setHover(null);
    onDismiss();
    if (restoreFocus) {
      ignoreFocus.current = true;
      getAnchorElement()?.focus({ preventScroll: true });
      queueMicrotask(() => {
        ignoreFocus.current = false;
      });
    }
  };
  const leave = useCallback(() => {
    pointerTransit.current = null;
    if (pinned) return;
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) setHover(null);
    }, 220);
  }, [pinned, cancelClose]);
  const travelingToCard = useCallback(
    (point: Point) => {
      const transit = pointerTransit.current;
      const card = panelRef.current;
      return !!(
        transit?.scope === scope &&
        card &&
        withinCardCorridor(point, transit.origin, card.getBoundingClientRect())
      );
    },
    [scope],
  );
  const leaveMark = (e: React.PointerEvent<SVGGElement>) => {
    if (pinned || e.pointerType === 'touch') return;
    if (e.currentTarget !== getAnchorElement() || pointerTransit.current)
      return;
    const origin = { x: e.clientX, y: e.clientY };
    const card = panelRef.current;
    if (card && origin.y <= card.getBoundingClientRect().top) {
      pointerTransit.current = { origin, scope };
      cancelClose();
    } else leave();
  };
  const enterCard = () => {
    pointerTransit.current = null;
    cancelClose();
  };
  useEffect(() => {
    if (pinned || !hover) return;
    const move = (e: PointerEvent) => {
      if (!pointerTransit.current) return;
      if (travelingToCard({ x: e.clientX, y: e.clientY })) cancelClose();
      else leave();
    };
    // Capture runs before another rectangle can replace the card in the gap.
    document.addEventListener('pointermove', move, true);
    const exit = () => leave();
    document.documentElement.addEventListener('pointerleave', exit);
    return () => {
      document.removeEventListener('pointermove', move, true);
      document.documentElement.removeEventListener('pointerleave', exit);
    };
  }, [pinned, hover, leave, travelingToCard, cancelClose]);
  const show = (target: InspectionTarget, point?: Point) => {
    if (pinned || ignoreFocus.current) return;
    if (point && travelingToCard(point)) return;
    pointerTransit.current = null;
    cancelClose();
    setHover((previous) =>
      previous?.scope === scope &&
      previous.target.islandId === target.islandId &&
      previous.target.periodId === target.periodId &&
      previous.target.eventId === target.eventId
        ? previous
        : { target, scope },
    );
  };
  const showPeriod = (p: Period, point?: Point) =>
    show({ islandId: p.islandId, periodId: p.id, year: p.start }, point);
  const pointFrom = (e: React.PointerEvent) => ({ x: e.clientX, y: e.clientY });
  const select = (p: Period, reveal = false) => {
    pointerTransit.current = null;
    cancelClose();
    setHover(null);
    setFocusId(p.id);
    onSelect(p);
    if (reveal)
      requestAnimationFrame(() =>
        ref.current
          ?.querySelector(`[data-period-id="${p.id}"]`)
          ?.scrollIntoView({ block: 'nearest' }),
      );
  };
  const selectClaim = (island: Island, event: HistoryEvent) => {
    pointerTransit.current = null;
    cancelClose();
    setHover(null);
    onClaim(island, event);
  };
  const pin = () => {
    if (!inspection) return;
    if (inspection.standalone)
      selectClaim(inspection.island, inspection.standalone);
    else select(inspection.period);
  };
  const tabTarget = periods.some((p) => p.id === focusId)
    ? focusId
    : inspection?.period.id || periods[0]?.id;
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
      e.preventDefault();
      dismiss(true);
      return;
    } else if (e.key === 'Tab' && !e.shiftKey && inspection) {
      e.preventDefault();
      (
        panelRef.current?.querySelector<HTMLElement>('[data-panel-primary]') ||
        panelRef.current?.querySelector<HTMLElement>('a, button:not(:disabled)')
      )?.focus();
      return;
    }
    if (next) {
      e.preventDefault();
      setFocusId(next.id);
      if (pinned) select(next);
      ref.current
        ?.querySelector<SVGGElement>(`[data-period-id="${next.id}"]`)
        ?.focus();
    }
  };
  return (
    <div className="period-atlas" ref={ref}>
      <PeriodCard
        inspection={inspection}
        pinned={pinned}
        anchor={anchor}
        panelRef={panelRef}
        onPin={pin}
        onSelect={(p) => select(p, true)}
        onDismiss={dismiss}
        onEnter={enterCard}
        onLeave={leave}
      />
      <div className="period-canvas" style={{ height: frame.height }}>
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
            buttons in the period details. Vertical distance and rectangle
            height do not measure population, area, or importance.
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
                    strokeWidth={activeIsland === p.islandId ? 1.8 : 1.1}
                    opacity={
                      activeIsland
                        ? activeIsland === p.islandId
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
            const active =
              p.id === inspection?.period.id && !inspection.standalone;
            const selected = pinned && active;
            const name = tracks.find((i) => i.id === p.islandId)!.name;
            return (
              <g
                key={p.id}
                data-period-id={p.id}
                transform={`translate(0 ${pos.y})`}
                className="period-mark"
                role="button"
                tabIndex={p.id === tabTarget ? 0 : -1}
                opacity={activeIsland && activeIsland !== p.islandId ? 0.22 : 1}
                data-highlighted={activeIsland === p.islandId}
                aria-expanded={active}
                aria-controls={active ? 'period-metadata' : undefined}
                aria-label={`${name}. ${owners[p.power].label}. ${periodDates(p, range)}.${p.event ? ' ' + p.event.title : ''}`}
                aria-pressed={selected}
                onKeyDown={(e) => keyboard(e, p)}
                onClick={() => select(p)}
                onFocus={() => {
                  setFocusId(p.id);
                  showPeriod(p);
                }}
                onBlur={leave}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch') showPeriod(p, pointFrom(e));
                }}
                onPointerMove={(e) => {
                  if (e.pointerType !== 'touch') showPeriod(p, pointFrom(e));
                }}
                onPointerLeave={leaveMark}
              >
                <rect
                  data-period-body
                  x={x(p.start)}
                  y={0}
                  width={Math.max(0, x(p.end) - x(p.start))}
                  height={pos.height}
                  fill={powerColor(p.power)}
                  stroke={active ? 'var(--ink)' : 'none'}
                  strokeWidth={active ? 1.3 : 0}
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
                {p.event && p.originalStart >= range[0] && (
                  <line
                    x1={x(p.start)}
                    x2={x(p.start)}
                    y1="0"
                    y2={pos.height}
                    stroke="var(--paper)"
                    strokeWidth=".8"
                  />
                )}
                {showQualified &&
                  p.event?.uncertainty &&
                  p.originalStart >= range[0] && (
                    <circle
                      className="qualified-mark"
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
                  y={-2}
                  width={Math.max(1, x(p.end) - x(p.start))}
                  height={pos.height + 4}
                  fill="transparent"
                />
              </g>
            );
          })}
          {claims.map(({ island, event }) => {
            const t = dateValue(event.date);
            // Resolve the same period as the card, including exact handover dates.
            const p = inspectTarget(
              { islandId: island.id, eventId: event.id, year: t },
              tracks,
              periods,
              mode,
              range,
            )?.period;
            if (!p) return null;
            const pos = frame.positions[p.id] || layout.positions[p.id];
            const xx = x(t);
            const yy = pos.y + pos.height / 2;
            return (
              <g
                key={event.id}
                className="claim-mark"
                data-claim-id={event.id}
                data-claim-period-id={p.id}
                opacity={activeIsland && activeIsland !== island.id ? 0.22 : 1}
                role="button"
                tabIndex={0}
                aria-label={`${island.name}. Claim only. ${eventDate(event)}. ${event.title}`}
                onClick={() => selectClaim(island, event)}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch')
                    show(
                      { islandId: island.id, eventId: event.id, year: t },
                      pointFrom(e),
                    );
                }}
                onPointerMove={(e) => {
                  if (e.pointerType !== 'touch')
                    show(
                      { islandId: island.id, eventId: event.id, year: t },
                      pointFrom(e),
                    );
                }}
                onPointerLeave={leaveMark}
                onFocus={() =>
                  show({ islandId: island.id, eventId: event.id, year: t })
                }
                onBlur={leave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectClaim(island, event);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    dismiss(true);
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
          {inspection && (
            <line
              x1={x(
                inspection.standalone
                  ? dateValue(inspection.standalone.date)
                  : inspection.period.start,
              )}
              x2={x(
                inspection.standalone
                  ? dateValue(inspection.standalone.date)
                  : inspection.period.start,
              )}
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
                  <span
                    className="power-row-name"
                    style={{
                      background: `color-mix(in srgb, ${powerColor(row.id)} 10%, var(--paper))`,
                    }}
                  >
                    {owners[row.id].label}
                  </span>
                </>
              ) : (
                <span>{tracks.find((i) => i.id === row.id)?.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {arrangement === 'islands' && (
        <div className="period-key" aria-label="Power colors">
          {data.owners
            .filter((o) => periods.some((p) => p.power === o.id))
            .map((o) => (
              <span key={o.id}>
                <i style={{ background: powerColor(o.id) }} />
                {o.label}
              </span>
            ))}
        </div>
      )}
      <p className="chart-scale-note">
        {spacing === 'events'
          ? 'Event spacing · equal gaps between relevant dates for the selected islands, not equal years. Shared dates share a tick.'
          : 'Linear time · Indigenous histories extend millennia before 1450.'}
      </p>
    </div>
  );
}
