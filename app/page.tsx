/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs its image role; the labeled scroll region has an explicit accessible role. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to focus and scroll the chart. */
'use client';
import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { registerAtlasTools } from '@/lib/atlas-tools';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { IslandMap } from '@/components/island-map';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { chartLayout } from '@/lib/chart-layout';
import { eventAxis } from '@/lib/event-axis';
import { PowerSymbol, powerAbbreviations } from '@/components/power-symbol';
import {
  Table,
  TableCaption,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  data,
  islands,
  owners,
  sources,
  type Island,
  type HistoryEvent,
  type Mode,
  changes,
  stateAt,
  dateValue,
  eventDate,
  historyPath,
  powersInRange,
  chartPowerRows,
  color,
  START,
  END,
} from '@/lib/history';

const ranges: Record<string, [number, number]> = {
  all: [START, END],
  empires: [1600, 1820],
  independence: [1790, END],
};
const stories = [
  {
    id: 'saint-lucia',
    number: '01',
    label: 'Repeated Anglo-French transfers',
    range: 'empires',
    year: 1763,
  },
  {
    id: 'guadeloupe',
    number: '02',
    label: 'Swedish title, British government',
    range: 'empires',
    year: 1813,
  },
  {
    id: 'haiti',
    number: '03',
    label: 'Revolution and independence',
    range: 'independence',
    year: 1804,
  },
  {
    id: 'tobago',
    number: '04',
    label: 'The Courland colony',
    range: 'empires',
    year: 1654,
  },
];
const kindLabel: Record<string, string> = {
  'context-change': 'Local control',
  'resistance-change': 'Resistance',
  capture: 'Occupation / conquest',
  restoration: 'Restoration',
  settlement: 'Colonial settlement',
  treaty: 'Treaty / agreement',
  independence: 'Independence',
  claim: 'Claim only',
  status: 'Constitutional change',
  withdrawal: 'Withdrawal',
  resistance: 'Resistance',
  context: 'Historical context',
};
function Cite({ ids }: { ids: string[] }) {
  return (
    <span className="citations">
      {Array.from(new Set(ids)).map((id, n) => (
        <a
          key={id}
          href={sources[id]?.url}
          target="_blank"
          rel="noreferrer"
          title={`${sources[id]?.publisher}: ${sources[id]?.title}`}
        >
          [{n + 1}]
          <span className="sr-only">
            {' '}
            {sources[id]?.title} (opens a new tab)
          </span>
        </a>
      ))}
    </span>
  );
}
function Arrow() {
  return <ArrowUpRight className="inline-icon" aria-hidden="true" />;
}

function StoryTrace({ id }: { id: string }) {
  const island = islands.find((i) => i.id === id)!;
  const path = historyPath(
    island,
    'administration',
    [START, END],
    (year) => 2 + ((year - START) / (END - START)) * 92,
    (power) =>
      3 +
      (data.owners.findIndex((o) => o.id === power) /
        (data.owners.length - 1)) *
        26,
    1,
  );
  return (
    <svg className="story-trace" viewBox="0 0 96 32" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function Home() {
  const [selected, setSelected] = useState('saint-lucia');
  const [hovered, setHovered] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('administration');
  const [period, setPeriod] = useState('all');
  const [view, setView] = useState('chart');
  const [eventId, setEventId] = useState('saint-lucia-12');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All islands');
  const [showClaims, setShowClaims] = useState(false);
  const [year, setYear] = useState(dateValue('1763-02-10'));
  const [overview, setOverview] = useState(false);
  const [showAllPowers, setShowAllPowers] = useState(false);
  const [axisSpacing, setAxisSpacing] = useState('time');
  const [evidence, setEvidence] = useState(false);
  const [tip, setTip] = useState<{
    island: Island;
    event: HistoryEvent;
    x: number;
    y: number;
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 1160, height: 580 });
  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setChartSize({ width, height });
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [view]);
  const current = islands.find((i) => i.id === selected) || islands[0];
  const focus = islands.find(
    (i) => i.id === (hovered || (overview ? null : selected)),
  );
  const event =
    current.events.find((e) => e.id === eventId) ||
    [...current.events].reverse().find((e) => dateValue(e.date) <= year) ||
    current.events[0];
  const range = ranges[period];
  const visible = islands.filter(
    (i) =>
      (group === 'All islands' || i.region === group) &&
      i.name.toLowerCase().includes(query.toLowerCase()),
  );
  const activeEventCount = data.islands.reduce(
    (n, i) => n + i.events.length,
    0,
  );
  const selectIsland = (id: string) => {
    const island = islands.find((i) => i.id === id);
    if (!island) return;
    setSelected(id);
    setHovered(null);
    setEventId('');
    setTip(null);
  };
  const selectEvent = (e: HistoryEvent) => {
    setEventId(e.id);
    setYear(dateValue(e.date));
    setTip(null);
  };
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTip(null);
        setHovered(null);
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(
    () =>
      registerAtlasTools(({ islandId, year, mode }) => {
        flushSync(() => {
          setSelected(islandId);
          setYear(year);
          setMode(mode);
          setPeriod('all');
          setView('chart');
          setGroup('All islands');
          setQuery('');
          setOverview(false);
          setEventId('');
          setHovered(null);
          setTip(null);
        });
      }),
    [],
  );
  const collapsePowers = chartSize.width < 600 && !showAllPowers && !overview;
  const ownerRows = chartPowerRows(current, mode, range, collapsePowers);
  const relevantPowers = powersInRange(focus || current, mode, range);
  const groupedCount =
    data.owners.length - ownerRows.filter((o) => o.id !== 'other').length;
  const layout = chartLayout(
    chartSize.width,
    chartSize.height,
    range,
    ownerRows.length,
  );
  const { width: W, height: H, left: L, right: R, top: TOP } = layout;
  const eventScale = eventAxis(
    range,
    (overview ? visible : [current]).flatMap((i) =>
      i.events.map((e) => dateValue(e.date)),
    ),
  );
  const eventSpacing = axisSpacing === 'events';
  const x = eventSpacing
    ? (date: number) => L + eventScale.position(date) * (W - L - R)
    : layout.x;
  const ticks = eventSpacing ? eventScale.domain : layout.ticks;
  const labelledTicks = new Set(
    eventSpacing ? eventScale.labels(W - L - R) : ticks,
  );
  const axisSubject = overview ? 'the visible islands' : current.name;
  const dateUnderCursor = current.events.find(
    (e) => dateValue(e.date) === year,
  );
  const cursorLabel = dateUnderCursor
    ? eventDate(dateUnderCursor)
    : String(Math.floor(year));
  const y = (owner: string) => {
    const index = ownerRows.findIndex((o) => o.id === owner);
    return layout.y(
      index < 0 ? ownerRows.findIndex((o) => o.id === 'other') : index,
    );
  };
  const offset = (i: Island) =>
    (islands.indexOf(i) - (islands.length - 1) / 2) * layout.laneStep;
  const ordered = [
    ...visible.filter((i) => i.id !== focus?.id),
    ...visible.filter((i) => i.id === focus?.id),
  ];
  const selectedInRange = current.events.filter(
    (e) => dateValue(e.date) >= range[0] && dateValue(e.date) <= range[1],
  );
  const atYear = stateAt(current, year, mode);
  function preset(s: (typeof stories)[number]) {
    setOverview(false);
    setHovered(null);
    setSelected(s.id);
    setPeriod(s.range);
    setGroup('All islands');
    setQuery('');
    setView('chart');
    const i = islands.find((i) => i.id === s.id)!;
    const e = i.events.find((e) => e.year === s.year);
    setYear(e ? dateValue(e.date) : s.year);
    setEventId(e?.id || '');
  }
  return (
    <main>
      <a className="skip-link" href="#explorer">
        Skip to the island explorer
      </a>
      <header className="masthead">
        <button
          className="wordmark"
          onClick={() => {
            setPeriod('all');
            setGroup('All islands');
            setQuery('');
          }}
        >
          <svg className="atlas-mark" viewBox="0 0 32 24" aria-hidden="true">
            <path
              d="M1 4h10v16h20M1 20h20V4h10M1 12h30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <span>
            Caribbean<span className="wordmark-sub">History atlas</span>
          </span>
        </button>
        <div className="masthead-right">
          <ThemeSwitcher />
          <button
            onClick={() => {
              setEvidence(!evidence);
              document
                .getElementById('sources-method')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="sources-label-long">Sources & method</span>
            <span className="sources-label-short">Sources</span> <Arrow />
          </button>
        </div>
      </header>
      <section className="intro">
        <h1>
          A sea of <span>empires</span>
        </h1>
        <p className="intro-copy">
          <span>
            {START}–{END}
          </span>{' '}
          · {islands.length} island histories
        </p>
      </section>
      <section
        className="explorer"
        id="explorer"
        aria-label="Interactive history atlas"
      >
        <div className="chart-side">
          <div className="chart-heading">
            <div className="chart-selection">
              <h2 className="sr-only">
                {mode === 'administration'
                  ? 'Political control'
                  : 'Sovereign title'}
              </h2>
              <Select
                value={selected}
                onValueChange={(v) => {
                  if (v) selectIsland(v);
                }}
                items={Object.fromEntries(islands.map((i) => [i.id, i.name]))}
              >
                <SelectTrigger
                  className="chart-island-select"
                  aria-label="Select island"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="chart-island-menu">
                  {[...islands]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((i) => (
                      <SelectItem value={i.id} key={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <span className="coverage">
                {changes(current, mode).length} changes <span> / </span>{' '}
                {islands.length} islands
              </span>
            </div>
            <Tabs
              className="axis-toggle"
              value={axisSpacing}
              onValueChange={(v) => {
                setAxisSpacing(String(v));
                setTip(null);
                setHovered(null);
              }}
            >
              <TabsList aria-label="Horizontal spacing">
                <TabsTrigger value="time">Time</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
            </Tabs>
            <a
              className="chart-options-link"
              href="#chart-options"
              onClick={() => {
                const options = document.getElementById(
                  'chart-options',
                ) as HTMLDetailsElement | null;
                if (options) options.open = true;
              }}
            >
              Options <ArrowDown className="inline-icon" aria-hidden="true" />
            </a>
          </div>
          {view === 'chart' ? (
            <>
              <div
                className="chart-scroll"
                ref={chartRef}
                role="region"
                aria-label="History chart fitted to your screen. Use the island selector or table for keyboard access."
                tabIndex={0}
                onPointerLeave={() => {
                  setHovered(null);
                  setTip(null);
                }}
              >
                <svg
                  className={`history-chart ${layout.compact ? 'compact-chart' : ''}`}
                  viewBox={`0 0 ${W} ${H}`}
                  width={W}
                  height={H}
                  role="img"
                  aria-labelledby="chart-title chart-desc"
                >
                  <title id="chart-title">{`Caribbean ${mode}: ${range[0]} to ${range[1]}`}</title>
                  <desc id="chart-desc">
                    {islands.length} island histories move between rows for
                    political powers. Vertical turns mark dated changes on a
                    {eventSpacing
                      ? `sequence of equally spaced event dates for ${axisSubject}; distances do not measure elapsed time`
                      : 'linear time axis'}
                    . Parallel lines within a row have no ranked meaning.{' '}
                    {collapsePowers
                      ? `${groupedCount} less relevant powers are grouped in the Other row; expand them using the control below.`
                      : 'All power rows are shown.'}{' '}
                    Select an island in the list or use the Table view for its
                    dated and cited chronology.{' '}
                    {focus
                      ? `The line for ${focus.name} is highlighted.`
                      : 'All histories are visible with equal emphasis.'}
                  </desc>
                  <defs>
                    <clipPath id="plot-clip">
                      <rect
                        x={L - 1}
                        y={TOP - 20}
                        width={W - L - R + 2}
                        height={H - TOP}
                      />
                    </clipPath>
                  </defs>
                  {!eventSpacing &&
                    data.contexts
                      .filter((c) => c.end >= range[0] && c.start <= range[1])
                      .map((c, k) => (
                        <g key={c.id}>
                          <rect
                            x={x(Math.max(c.start, range[0]))}
                            y={TOP - 25}
                            width={Math.max(
                              1,
                              x(Math.min(c.end, range[1])) -
                                x(Math.max(c.start, range[0])),
                            )}
                            height={H - TOP + 16}
                            fill={
                              c.id === 'independence'
                                ? 'var(--era-free)'
                                : 'var(--era-fill)'
                            }
                            opacity={c.id === 'independence' ? 0.045 : 0.035}
                          />
                          {layout.numbered &&
                            (period !== 'all' ||
                              ['seven-years', 'independence'].includes(
                                c.id,
                              )) && (
                              <text
                                x={x(Math.max(c.start, range[0])) + 3}
                                y={k % 2 === 0 ? 17 : 31}
                                className="era-label"
                              >
                                {c.title}
                              </text>
                            )}
                        </g>
                      ))}
                  {ticks.map((t) => (
                    <g key={t}>
                      <line
                        x1={x(t)}
                        x2={x(t)}
                        y1={TOP - 10}
                        y2={
                          eventSpacing && !labelledTicks.has(t)
                            ? TOP - 4
                            : H - 8
                        }
                        className="year-grid"
                      />
                      {labelledTicks.has(t) && (
                        <text
                          x={x(t)}
                          y={TOP - 15}
                          textAnchor={
                            t === range[0]
                              ? 'start'
                              : t === range[1]
                                ? 'end'
                                : 'middle'
                          }
                          className="year-label"
                        >
                          {Math.floor(t)}
                        </text>
                      )}
                    </g>
                  ))}
                  {ownerRows.map((o, row) => (
                    <g key={o.id} className="power-row" data-power={o.id}>
                      <line
                        x1={L}
                        x2={W - R}
                        y1={y(o.id)}
                        y2={y(o.id)}
                        className="owner-grid"
                      />
                      <PowerSymbol
                        id={o.id}
                        x={layout.numbered ? 24 : 0}
                        y={y(o.id) - 8}
                      />
                      {layout.numbered && (
                        <text x={0} y={y(o.id) + 4} className="owner-index">
                          {String(row + 1).padStart(2, '0')}
                        </text>
                      )}
                      <text
                        x={layout.numbered ? 54 : layout.compact ? 29 : 30}
                        y={y(o.id) + 4}
                        className={`owner-label ${relevantPowers.has(o.id) ? 'owner-used' : 'owner-muted'}`}
                      >
                        <title>{`${o.label}: ${o.description}`}</title>
                        {layout.compact ? powerAbbreviations[o.id] : o.label}
                      </text>
                    </g>
                  ))}
                  <g clipPath="url(#plot-clip)">
                    {ordered.map((i) => {
                      const active = i.id === focus?.id;
                      const yy = (o: string) => y(o) + offset(i);
                      const path = historyPath(
                        i,
                        mode,
                        range,
                        x,
                        yy,
                        layout.compact ? 3 : 5,
                      );
                      return (
                        <g
                          key={i.id}
                          className={`island-path ${active ? 'is-active' : ''}`}
                        >
                          <path
                            d={path}
                            fill="none"
                            stroke={
                              active
                                ? 'var(--focus-line)'
                                : overview
                                  ? color(i)
                                  : 'var(--trace)'
                            }
                            strokeWidth={
                              active
                                ? layout.compact
                                  ? 2
                                  : 2.8
                                : layout.compact
                                  ? 0.8
                                  : 1.15
                            }
                            opacity={active ? 1 : focus ? 0.35 : 0.72}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                          <path
                            d={path}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={8}
                            onPointerEnter={(ev) => {
                              if (ev.pointerType !== 'touch') setHovered(i.id);
                            }}
                            onClick={() => selectIsland(i.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <circle
                            cx={x(range[1])}
                            cy={yy(stateAt(i, range[1], mode))}
                            r={active ? 3.5 : 1.6}
                            fill={
                              active
                                ? 'var(--focus-line)'
                                : overview
                                  ? color(i)
                                  : 'var(--trace)'
                            }
                            opacity={active ? 1 : 0.25}
                          />
                        </g>
                      );
                    })}
                    {focus &&
                      visible.some((i) => i.id === focus.id) &&
                      focus.events
                        .filter(
                          (e) =>
                            dateValue(e.date) >= range[0] &&
                            dateValue(e.date) <= range[1] &&
                            ((mode === 'administration'
                              ? e.changesControl
                              : e.changesSovereignty) ||
                              (showClaims && e.kind === 'claim')),
                        )
                        .map((e) => {
                          const owner =
                            mode === 'administration'
                              ? e.resultingController
                              : e.resultingSovereign;
                          const xx = x(dateValue(e.date)),
                            yy = y(owner) + offset(focus);
                          return (
                            <g
                              key={e.id}
                              onPointerEnter={(ev) => {
                                if (ev.pointerType === 'touch') return;
                                const box =
                                  chartRef.current?.getBoundingClientRect();
                                if (box)
                                  setTip({
                                    island: focus,
                                    event: e,
                                    x: Math.max(
                                      0,
                                      Math.min(
                                        ev.clientX -
                                          box.left +
                                          chartRef.current!.scrollLeft +
                                          12,
                                        box.width - 285,
                                      ),
                                    ),
                                    y: ev.clientY - box.top + 14,
                                  });
                              }}
                              onClick={() => {
                                setSelected(focus.id);
                                selectEvent(e);
                              }}
                              className="event-node"
                            >
                              <circle
                                cx={xx}
                                cy={yy}
                                r={9}
                                fill="transparent"
                              />
                              <circle
                                cx={xx}
                                cy={yy}
                                r={
                                  layout.compact
                                    ? e.id === eventId
                                      ? 3.5
                                      : 2.3
                                    : e.id === eventId
                                      ? 5
                                      : 3.7
                                }
                                fill={
                                  e.kind === 'claim'
                                    ? 'var(--paper)'
                                    : 'var(--focus-line)'
                                }
                                stroke={
                                  e.kind === 'claim'
                                    ? 'var(--focus-line)'
                                    : 'var(--paper)'
                                }
                                strokeWidth={1.5}
                              />
                              {e.uncertainty && (
                                <circle
                                  cx={xx}
                                  cy={yy}
                                  r={6.5}
                                  fill="none"
                                  stroke="var(--focus-line)"
                                  strokeWidth={0.8}
                                  strokeDasharray="1.5 2"
                                />
                              )}
                            </g>
                          );
                        })}
                    {year >= range[0] && year <= range[1] && (
                      <g className="year-cursor">
                        <line
                          x1={x(year)}
                          x2={x(year)}
                          y1={TOP - 23}
                          y2={H - 8}
                          stroke="var(--ink)"
                          strokeWidth={1}
                          strokeDasharray="3 5"
                          opacity={0.5}
                        />
                      </g>
                    )}
                  </g>
                </svg>
                {tip && (
                  <div
                    className="chart-tooltip"
                    role="tooltip"
                    style={{ left: tip.x, top: Math.min(tip.y, H - 130) }}
                  >
                    <span>
                      {tip.island.name} · {eventDate(tip.event)}
                    </span>
                    <strong>{tip.event.title}</strong>
                    <p>{tip.event.detail}</p>
                    <small>Click for sources & context</small>
                  </div>
                )}
              </div>
              <p className="chart-scale-note">
                {eventSpacing
                  ? `Event spacing · ${axisSubject}. Equal gaps represent successive dated records, not equal years. Shared dates share a tick.`
                  : period === 'all'
                    ? 'Linear time · Indigenous histories extend millennia before 1450.'
                    : 'Linear time · Treaty dates and handovers may differ.'}
              </p>
              <div className="chart-legend">
                <span>
                  <i
                    className="legend-line"
                    style={{
                      background: focus ? 'var(--focus-line)' : 'var(--trace)',
                    }}
                  />{' '}
                  {focus ? focus.name : 'All island histories'}
                </span>
                <span>
                  <i className="legend-dot" /> Change of power
                </span>
                <span>
                  <i className="legend-uncertain" /> Qualified date or extent
                </span>
                <button
                  aria-pressed={showClaims}
                  onClick={() => setShowClaims(!showClaims)}
                >
                  {showClaims ? 'Hide' : 'Show'} claim markers
                </button>
              </div>
            </>
          ) : (
            <div className="ledger-wrap">
              <Table>
                <TableCaption>
                  {current.name}: complete dated chronology. The period filter
                  affects the chart, not this table.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Date</TableHead>
                    <TableHead scope="col">Event</TableHead>
                    <TableHead scope="col">Administration after</TableHead>
                    <TableHead scope="col">Sovereign title after</TableHead>
                    <TableHead scope="col">Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{eventDate(e)}</TableCell>
                      <TableCell>
                        <button
                          className="table-event"
                          onClick={() => selectEvent(e)}
                        >
                          {e.title}
                        </button>
                        <p>{e.detail}</p>
                        {e.uncertainty && (
                          <p className="qualification">{e.uncertainty}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {owners[e.resultingController].label}
                      </TableCell>
                      <TableCell>
                        {owners[e.resultingSovereign].label}
                      </TableCell>
                      <TableCell>
                        <Cite ids={e.sources} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="power-legend-row">
            <details className="power-key">
              <summary>Powers &amp; flags</summary>
              <p>
                Flags identify powers using modern designs; they do not change
                with historical dates. UK includes earlier English rule.
                Lettermarks identify Courland and Gran Colombia. Indigenous
                societies and independent states have no single national flag.
              </p>
              <ul>
                {data.owners.map((o) => (
                  <li key={o.id}>
                    <svg viewBox="0 0 22 17" aria-hidden="true">
                      <PowerSymbol id={o.id} />
                    </svg>
                    <div>
                      <strong>{o.label}</strong>
                      <p>{o.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p>
                SVG flags:{' '}
                <a
                  href="https://github.com/lipis/flag-icons"
                  target="_blank"
                  rel="noreferrer"
                >
                  flag-icons (MIT)
                </a>
                . Order flag:{' '}
                <a
                  href="https://www.orderofmalta.int/government/flags-emblems/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Order of Malta
                </a>
                .
              </p>
            </details>
            {layout.compact && !overview && (
              <button
                className="power-toggle"
                onClick={() => {
                  setShowAllPowers(!showAllPowers);
                  setHovered(null);
                }}
                aria-pressed={showAllPowers}
              >
                {showAllPowers
                  ? 'Group other powers'
                  : `Expand ${groupedCount} other powers`}
              </button>
            )}
          </div>
          <div className="time-control">
            <div>
              <span id="time-label">Explore a year</span>
              <output>{Math.floor(year)}</output>
            </div>
            <Slider
              value={[
                eventSpacing
                  ? eventScale.position(year) * (eventScale.domain.length - 1)
                  : Math.max(range[0], Math.min(Math.floor(year), range[1])),
              ]}
              min={eventSpacing ? 0 : range[0]}
              max={eventSpacing ? eventScale.domain.length - 1 : range[1]}
              step={1}
              thumbLabel={eventSpacing ? 'Event to explore' : 'Year to explore'}
              thumbValueText={cursorLabel}
              onValueChange={(v) => {
                const value = typeof v === 'number' ? v : v[0];
                setYear(
                  eventSpacing ? eventScale.domain[Math.round(value)] : value,
                );
                setEventId('');
                setTip(null);
              }}
            />
            <span className="year-state">
              {current.name} <strong>{owners[atYear].label}</strong>
            </span>
          </div>
          <a className="event-peek" href="#selected-event">
            <time>{eventDate(event)}</time>
            <span>{event.title}</span>
            <span className="event-peek-link">
              Read event{' '}
              <ArrowDown className="inline-icon" aria-hidden="true" />
            </span>
          </a>
          <details className="chart-options" id="chart-options">
            <summary>
              Chart options{' '}
              <span>
                {mode === 'administration'
                  ? 'Administration'
                  : 'Sovereign title'}{' '}
                · {range[0]}–{range[1]}
              </span>
            </summary>
            <div className="toolbar">
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList aria-label="What the lines represent">
                  <TabsTrigger value="administration">
                    Administration
                  </TabsTrigger>
                  <TabsTrigger value="sovereignty">Sovereign title</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="toolbar-right">
                <Select
                  value={period}
                  onValueChange={(v) => {
                    if (v) {
                      setPeriod(v);
                      setYear((n) =>
                        Math.max(ranges[v][0], Math.min(n, ranges[v][1])),
                      );
                    }
                  }}
                  items={{
                    all: 'The whole story',
                    empires: 'The imperial contest',
                    independence: 'Toward independence',
                  }}
                >
                  <SelectTrigger aria-label="Time period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      The whole story · 1450–2026
                    </SelectItem>
                    <SelectItem value="empires">
                      The imperial contest · 1600–1820
                    </SelectItem>
                    <SelectItem value="independence">
                      Toward independence · 1790–2026
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Tabs value={view} onValueChange={(v) => setView(String(v))}>
                  <TabsList aria-label="Display">
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="ledger">Table</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="view-caption">
              <p className="view-explanation">
                {mode === 'administration'
                  ? 'Colonial governments and substantial military occupations. A claim alone does not move a line.'
                  : 'Recorded sovereign status. Occupation can change the government without changing the title.'}
              </p>
              <button
                className="overview-toggle"
                aria-pressed={overview}
                onClick={() => {
                  setOverview(!overview);
                  setHovered(null);
                }}
              >
                {overview ? 'Focus selected island' : 'Compare all lines'}
              </button>
            </div>
          </details>
          <nav className="stories" aria-label="Stories to explore">
            {stories.map((s) => (
              <button
                key={s.id}
                className={selected === s.id ? 'story active' : 'story'}
                onClick={() => preset(s)}
              >
                <span className="story-number">{s.number}</span>
                <span className="story-copy">
                  <strong>{islands.find((i) => i.id === s.id)?.name}</strong>
                  <span>{s.label}</span>
                </span>
                <StoryTrace id={s.id} />
                <span className="story-arrow" aria-hidden="true">
                  <Arrow />
                </span>
              </button>
            ))}
          </nav>
          <details className="war-context">
            <summary>The wars behind the crossings</summary>
            <div>
              {data.contexts
                .filter((c) => c.end >= range[0] && c.start <= range[1])
                .map((c) => (
                  <article key={c.id}>
                    <h3>
                      {c.start}–{c.end} · {c.title}
                    </h3>
                    <p>
                      {c.description} <Cite ids={c.sources} />
                    </p>
                  </article>
                ))}
            </div>
          </details>
        </div>
        <aside className="inspector" aria-label="Selected island details">
          <div className="inspector-body">
            <div className="island-overview">
              <div className="island-identification">
                <span>Selected island</span>
                <span className="island-index">
                  {String(islands.indexOf(current) + 1).padStart(2, '0')} /{' '}
                  {islands.length}
                </span>
              </div>
              <h2 className="island-title">{current.name}</h2>
              <p className="island-summary">{current.summary}</p>
              <div className="island-stats">
                <div>
                  <strong>{changes(current, mode).length}</strong>
                  <span>
                    recorded {mode === 'administration' ? 'control' : 'title'}{' '}
                    changes
                  </span>
                </div>
                <div>
                  <strong>{owners[current.currentSovereign].label}</strong>
                  <span>sovereign status today</span>
                </div>
              </div>
              <div className="map-slot" id="island-map">
                <p className="region-name">{current.region}</p>
                <IslandMap island={current} year={year} mode={mode} />
                <p className="coordinates">
                  {Math.abs(current.coordinates[1]).toFixed(2)}° N &nbsp;{' '}
                  {Math.abs(current.coordinates[0]).toFixed(2)}° W
                </p>
                <p className="map-people">{current.peoples}</p>
              </div>
            </div>
            <div className="event-detail">
              <div
                className="event-card"
                id="selected-event"
                aria-live="polite"
                aria-atomic="true"
              >
                <p className="event-position">
                  {dateValue(event.date) > year
                    ? 'Next recorded event'
                    : 'Selected historical event'}
                </p>
                <div className="event-date">
                  {eventDate(event)}{' '}
                  <span>{kindLabel[event.kind] || event.kind}</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.detail}</p>
                {(mode === 'administration'
                  ? event.changesControl
                  : event.changesSovereignty) && (
                  <p className="event-transition">
                    {
                      owners[
                        mode === 'administration'
                          ? event.previousController
                          : event.previousSovereign
                      ]?.label
                    }
                    <ArrowRight className="inline-icon" aria-hidden="true" />
                    {
                      owners[
                        mode === 'administration'
                          ? event.resultingController
                          : event.resultingSovereign
                      ]?.label
                    }
                  </p>
                )}
                {event.uncertainty && (
                  <p className="qualification">
                    <span>Evidence note</span>
                    {event.uncertainty}
                  </p>
                )}
                {event.qualification && (
                  <p className="qualification">{event.qualification}</p>
                )}
                <div className="event-sources">
                  <span>Sources</span>
                  <Cite ids={event.sources} />
                </div>
                <div className="event-nav">
                  <button
                    disabled={current.events.indexOf(event) === 0}
                    onClick={() =>
                      selectEvent(
                        current.events[current.events.indexOf(event) - 1],
                      )
                    }
                  >
                    <ArrowLeft className="inline-icon" aria-hidden="true" />{' '}
                    Previous
                  </button>
                  <span>
                    {current.events.indexOf(event) + 1} /{' '}
                    {current.events.length}
                  </span>
                  <button
                    disabled={
                      current.events.indexOf(event) ===
                      current.events.length - 1
                    }
                    onClick={() =>
                      selectEvent(
                        current.events[current.events.indexOf(event) + 1],
                      )
                    }
                  >
                    Next{' '}
                    <ArrowRight className="inline-icon" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <details className="island-notes">
                <summary>The history behind the line</summary>
                <p>{current.notes}</p>
                <Cite ids={current.sources} />
              </details>
            </div>
            <div className="chronology">
              <div className="event-list-heading">
                <h3>Chronology</h3>
                <span>{selectedInRange.length} events in view</span>
              </div>
              <ol className="event-list">
                {selectedInRange.map((e) => (
                  <li key={e.id}>
                    <button
                      className={e.id === event.id ? 'active' : ''}
                      onClick={() => selectEvent(e)}
                    >
                      <time>{eventDate(e)}</time>
                      <span>{e.title}</span>
                      {(mode === 'administration'
                        ? e.changesControl
                        : e.changesSovereignty) && (
                        <i style={{ background: 'var(--focus-line)' }} />
                      )}
                    </button>
                  </li>
                ))}
              </ol>
              {!selectedInRange.length && (
                <p className="quiet">
                  No recorded events in this period.{' '}
                  <button
                    onClick={() => setPeriod('all')}
                    className="text-button"
                  >
                    Show the whole story
                  </button>
                  .
                </p>
              )}
            </div>
          </div>
        </aside>
        <div className="island-browser">
          <div className="browse-top">
            <h3>Follow an island</h3>
            <label className="search" htmlFor="island-search">
              <span className="sr-only">Search islands</span>
              <Input
                id="island-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find an island…"
                type="search"
              />
            </label>
            <Select
              value={group}
              onValueChange={(v) => {
                if (v) setGroup(v);
              }}
            >
              <SelectTrigger aria-label="Island region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All islands', ...new Set(islands.map((i) => i.region))].map(
                  (g) => (
                    <SelectItem value={g} key={g}>
                      {g}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="island-list">
            {visible.map((i) => (
              <button
                key={i.id}
                aria-pressed={selected === i.id}
                className={
                  selected === i.id ? 'island-chip selected' : 'island-chip'
                }
                onPointerEnter={(ev) => {
                  if (ev.pointerType !== 'touch') setHovered(i.id);
                }}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(i.id)}
                onBlur={() => setHovered(null)}
                onClick={() => selectIsland(i.id)}
              >
                <span
                  style={{
                    background:
                      selected === i.id || hovered === i.id
                        ? 'var(--focus-line)'
                        : overview
                          ? color(i)
                          : 'var(--trace)',
                  }}
                />
                {i.name}
              </button>
            ))}
          </div>
          {visible.length === 0 && (
            <p>
              No islands match.{' '}
              <button
                className="text-button"
                onClick={() => {
                  setQuery('');
                  setGroup('All islands');
                }}
              >
                Clear filters
              </button>
            </p>
          )}
          {!visible.some((i) => i.id === selected) && visible.length > 0 && (
            <p className="quiet">
              The selected island is outside this filter. Choose a visible
              island, or{' '}
              <button
                className="text-button"
                onClick={() => {
                  setQuery('');
                  setGroup('All islands');
                }}
              >
                show all islands
              </button>
              .
            </p>
          )}
        </div>
      </section>
      <section className="context-strip">
        <h2>
          People under
          <br />
          imperial rule
        </h2>
        <div>
          <p>
            Sugar, strategic harbours and Atlantic trade made these islands
            imperial prizes. Their wealth was built through Indigenous
            dispossession and the labour of enslaved Africans.
          </p>
          <p>
            The lines trace political power. They cannot contain the lives,
            resistance and cultures that endured beneath it. Indigenous
            Caribbean peoples did not disappear.{' '}
            <Cite ids={['regional', 'survival']} />
          </p>
        </div>
      </section>
      <section className="evidence" id="sources-method">
        <div className="evidence-top">
          <div>
            <h2>Sources and editorial method</h2>
          </div>
          <div className="downloads">
            <a href="/data/caribbean.json" download>
              Dataset · JSON{' '}
              <Download className="inline-icon" aria-hidden="true" />
            </a>
            <a href="/data/events.csv" download>
              Chronology · CSV{' '}
              <Download className="inline-icon" aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="method-grid">
          <p>
            <strong>
              {new Set(islands.map((i) => i.place)).size} places.{' '}
              {islands.length} histories.
            </strong>{' '}
            The places in the original scope include sovereign states and
            dependencies. Islands with divergent histories get separate tracks.
            Groups and principal-island proxies are identified in their notes.
          </p>
          <p>
            <strong>Claims are not control.</strong> A European claim does not
            erase Indigenous sovereignty. Occupation, legal title and
            independence are different events. The shared row includes disputed,
            concurrent or interrupted administrations; it is not another empire.
          </p>
          <p>
            <strong>Dates and uncertainty.</strong> {activeEventCount} records
            cite {data.sources.length} sources. Circa dates and disagreements
            are flagged. This is a curated chronology of major transitions, not
            every raid or outpost. Detailed colonial dates often rely on
            secondary compilations.
          </p>
        </div>
        <details
          open={evidence}
          onToggle={(e) => setEvidence(e.currentTarget.open)}
        >
          <summary>
            Bibliography & editorial notes{' '}
            <span>
              {data.sources.length} sources <Arrow />
            </span>
          </summary>
          <p className="bibliography-intro">
            Compiled 6 September 2026. Treaty editions, local museums,
            government histories and scholarship are supplemented by specialist
            chronologies. A citation establishes provenance, not a claim of
            archival certainty.{' '}
            <a href="/data/editorial-notes.json" download>
              Download the qualified records
            </a>
            .
          </p>
          <ol className="bibliography">
            {data.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title} <Arrow />
                </a>
                <span>
                  {s.publisher} · {s.type}
                </span>
              </li>
            ))}
          </ol>
          <p className="quiet">{data.meta.completeness}</p>
          <p className="quiet">{data.meta.baseline}</p>
        </details>
      </section>
      <footer>
        <span>A sea of empires</span>
        <span>Research edition · 2026</span>
      </footer>
    </main>
  );
}
