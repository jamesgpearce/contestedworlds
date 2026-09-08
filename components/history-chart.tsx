/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG periods expose button semantics; native Previous/Next controls navigate the selected history. */
'use client';
import { assetPath } from '@/lib/site-config';
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
import { islandFlags } from '@/lib/island-flags';
import { eventAxis } from '@/lib/event-axis';
import { PeriodCard } from '@/components/period-card';
import { inspectTarget, type InspectionTarget } from '@/lib/chart-inspection';
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
function useMovingPeriods(
  target: Frame,
  arrangement: Arrangement,
  ready: boolean,
) {
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
    if (!ready || first.current || reduce.matches || !regrouping) {
      // Restoring URL state is initialization, not an interactive regrouping.
      first.current = !ready;
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
  }, [target, arrangement, ready]);
  return frame;
}

export function HistoryChart({
  viewReady,
  tracks,
  mode,
  range,
  arrangement,
  spacing,
  scale,
  showClaims,
  showQualified,
  pinnedTarget,
  revealRequest,
  onDismiss,
  onSelect,
  onClaim,
}: {
  viewReady: boolean;
  tracks: Island[];
  mode: Mode;
  range: [number, number];
  arrangement: Arrangement;
  spacing: string;
  scale: ReturnType<typeof eventAxis>;
  showClaims: boolean;
  showQualified: boolean;
  pinnedTarget: InspectionTarget | null;
  revealRequest: number;
  onDismiss: () => void;
  onSelect: (period: Period) => void;
  onClaim: (island: Island, event: HistoryEvent) => void;
}) {
  const pinned = !!pinnedTarget;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRevealRequest = useRef(0);
  const [hover, setHover] = useState<{
    target: InspectionTarget;
    scope: string;
  } | null>(null);
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
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    // Measure synchronously before the first hydrated paint; the observer handles
    // subsequent resizing, not the chart's initial dimensions.
    const measuredWidth = container.getBoundingClientRect().width;
    if (measuredWidth > 0) setWidth(measuredWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  const periods = useMemo(
    () => tracks.flatMap((i) => periodsFor(i, mode, range)),
    [tracks, mode, range],
  );
  const trackNames = useMemo(
    () => Object.fromEntries(tracks.map((island) => [island.id, island.name])),
    [tracks],
  );
  const periodLabels = useMemo(
    () =>
      Object.fromEntries(
        periods.map((p) => [
          p.id,
          `${trackNames[p.islandId]}. ${owners[p.power].label}. ${periodDates(p)}.${p.event ? ' ' + p.event.title : ''}`,
        ]),
      ),
    [periods, trackNames],
  );
  // Routes and claim-to-period matches do not change during hover or animation.
  const routes = useMemo(
    () =>
      tracks.map((island) => periods.filter((p) => p.islandId === island.id)),
    [tracks, periods],
  );
  const claims = useMemo(
    () =>
      showClaims
        ? tracks.flatMap((island) =>
            island.events.flatMap((event) => {
              const time = dateValue(event.date);
              if (event.kind !== 'claim' || time < range[0] || time > range[1])
                return [];
              const period = inspectTarget(
                { islandId: island.id, eventId: event.id, year: time },
                tracks,
                periods,
                mode,
                range,
              )?.period;
              return period
                ? [
                    {
                      island,
                      event,
                      period,
                      time,
                      label: `${island.name}. Claim only. ${eventDate(event)}. ${event.title}`,
                    },
                  ]
                : [];
            }),
          )
        : [],
    [tracks, periods, mode, range, showClaims],
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
  const ready = viewReady && width > 0;
  const frame = useMovingPeriods(target, arrangement, ready);
  const changing = Math.abs(frame.connectors - target.connectors) > 0.001;
  const plotWidth = Math.max(1, width - layout.left - layout.right);
  const x = (date: number) =>
    layout.left +
    (spacing === 'events'
      ? scale.position(date)
      : (date - range[0]) / (range[1] - range[0])) *
      plotWidth;
  const inspection = inspectTarget(
    pinnedTarget
      ? pinnedTarget
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
    if (!revealRequest || revealRequest === lastRevealRequest.current) return;
    // Shared details may arrive before the responsive chart has measured itself.
    if (
      Math.abs((ref.current?.clientWidth || 0) - width) > 1 ||
      frame.height !== target.height ||
      changing
    )
      return;
    const element = getAnchorElement();
    if (!element) return;
    lastRevealRequest.current = revealRequest;
    element.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }, [
    revealRequest,
    getAnchorElement,
    width,
    frame.height,
    target.height,
    changing,
  ]);
  const dismiss = () => {
    cancelClose();
    setHover(null);
    onDismiss();
  };
  const leave = useCallback(() => {
    if (pinned) return;
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) setHover(null);
    }, 220);
  }, [pinned, cancelClose]);
  const show = (target: InspectionTarget) => {
    if (pinned) return;
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
  const showPeriod = (p: Period) =>
    show({ islandId: p.islandId, periodId: p.id, year: p.start });
  const select = (p: Period, reveal = false) => {
    cancelClose();
    setHover(null);
    onSelect(p);
    if (reveal)
      requestAnimationFrame(() =>
        ref.current
          ?.querySelector(`[data-period-id="${p.id}"]`)
          ?.scrollIntoView({ block: 'nearest' }),
      );
  };
  const selectClaim = (island: Island, event: HistoryEvent) => {
    cancelClose();
    setHover(null);
    onClaim(island, event);
  };
  if (!ready) {
    // Static HTML cannot know the browser's container width. Reserve the correct
    // row height for either layout, but never expose a provisionally sized SVG.
    const wideHeight = arrangePeriods(
      periods,
      tracks.map((island) => island.id),
      data.owners.map((owner) => owner.id),
      1000,
      arrangement,
    ).height;
    return (
      <div className="period-atlas chart-measuring" ref={ref} aria-busy="true">
        <div
          className="chart-measuring-space"
          style={
            {
              '--wide-chart-height': `${wideHeight}px`,
              '--compact-chart-height': `${layout.height}px`,
            } as React.CSSProperties
          }
        />
        <p className="chart-scale-note" role="status">
          Preparing chart…
        </p>
      </div>
    );
  }
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
  return (
    <div className="period-atlas" ref={ref}>
      <PeriodCard
        inspection={inspection}
        pinned={pinned}
        anchor={anchor}
        panelRef={panelRef}
        onSelect={(p) => select(p, true)}
        onDismiss={dismiss}
        onEnter={cancelClose}
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
            Color identifies the power. Select a rectangle or claim marker to
            inspect it, then use Previous and Next in the details card. Vertical
            distance and rectangle height do not measure population, area, or
            importance.
          </desc>
          {arrangement === 'powers' && (
            <g
              className="power-label-cells"
              aria-hidden="true"
              opacity={changing ? 0 : 1}
            >
              {layout.rows.map((row) => (
                <g
                  key={row.id}
                  fill={`color-mix(in srgb, ${powerColor(row.id)} 10%, var(--paper))`}
                >
                  {layout.left > 8 && (
                    <rect
                      x={0}
                      y={row.top}
                      width={layout.left}
                      height={row.bottom - row.top}
                    />
                  )}
                  {layout.compact && (
                    <rect
                      x={0}
                      y={row.top}
                      width={width - layout.right}
                      height={30}
                    />
                  )}
                </g>
              ))}
            </g>
          )}
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
              x1={arrangement === 'powers' ? 0 : layout.left}
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
            {routes.flatMap((route) => {
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
            return (
              <g
                key={p.id}
                data-period-id={p.id}
                transform={`translate(0 ${pos.y})`}
                className="period-mark"
                role="button"
                tabIndex={-1}
                opacity={activeIsland && activeIsland !== p.islandId ? 0.22 : 1}
                data-highlighted={activeIsland === p.islandId}
                aria-expanded={active}
                aria-controls={active ? 'period-metadata' : undefined}
                aria-label={periodLabels[p.id]}
                aria-pressed={selected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(p);
                  }
                }}
                onClick={() => select(p)}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch') showPeriod(p);
                }}
                onPointerMove={(e) => {
                  if (e.pointerType !== 'touch') showPeriod(p);
                }}
                onPointerLeave={leave}
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
          {claims.map(({ island, event, period: p, time: t, label }) => {
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
                tabIndex={-1}
                aria-label={label}
                onClick={() => selectClaim(island, event)}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch')
                    show({ islandId: island.id, eventId: event.id, year: t });
                }}
                onPointerMove={(e) => {
                  if (e.pointerType !== 'touch')
                    show({ islandId: island.id, eventId: event.id, year: t });
                }}
                onPointerLeave={leave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectClaim(island, event);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    dismiss();
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
          className="period-start-labels"
          aria-hidden="true"
          style={{ opacity: changing ? 0 : 1 }}
        >
          {layout.starting.map((p) => {
            const pos = frame.positions[p.id] || layout.positions[p.id];
            const name = trackNames[p.islandId];
            return (
              <span
                key={p.islandId}
                data-start-island={p.islandId}
                data-start-period={p.id}
                className="period-start-label"
                style={{
                  top: pos.y + pos.height / 2,
                  width: layout.left - 18,
                  opacity:
                    activeIsland && activeIsland !== p.islandId ? 0.4 : 1,
                }}
              >
                {name}
              </span>
            );
          })}
        </div>
        <div
          className="period-row-labels"
          aria-hidden="true"
          style={{ opacity: changing ? 0 : 1 }}
        >
          {layout.rows.map((row) => (
            <div
              key={`${arrangement}:${row.id}`}
              className={`period-row-label ${layout.compact ? 'above-row' : ''} ${arrangement === 'powers' ? 'power-label' : ''}`}
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
                  <span className="power-row-name">
                    {row.id === 'indigenous'
                      ? 'Indigenous'
                      : owners[row.id].label}
                  </span>
                </>
              ) : (
                <>
                  {islandFlags[row.id] && (
                    <svg
                      width="22"
                      height="17"
                      viewBox="0 0 22 17"
                      aria-hidden="true"
                    >
                      <image
                        href={assetPath(`/flags/${islandFlags[row.id]}.svg`)}
                        width={22}
                        height={16.5}
                      />
                    </svg>
                  )}
                  <span>{trackNames[row.id]}</span>
                </>
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
