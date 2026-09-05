/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs its image role; the labeled scroll region has an explicit accessible role. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to focus and scroll the chart. */
'use client';
import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
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
    label: 'The island that kept changing sides',
    range: 'empires',
    year: 1763,
  },
  {
    id: 'guadeloupe',
    number: '02',
    label: 'An island traded on paper',
    range: 'empires',
    year: 1813,
  },
  {
    id: 'haiti',
    number: '03',
    label: 'A revolution that changed the world',
    range: 'independence',
    year: 1804,
  },
  {
    id: 'tobago',
    number: '04',
    label: 'Even a duchy wanted a piece',
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
  return <span aria-hidden="true">↗</span>;
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
  const [evidence, setEvidence] = useState(false);
  const [tip, setTip] = useState<{
    island: Island;
    event: HistoryEvent;
    x: number;
    y: number;
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
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
  const ownerRows = data.owners;
  const W = 1160,
    L = 154,
    R = 30,
    TOP = 67,
    STEP = 43,
    H = TOP + ownerRows.length * STEP + 23;
  const x = (n: number) =>
    L + ((n - range[0]) / (range[1] - range[0])) * (W - L - R);
  const y = (owner: string) =>
    TOP + ownerRows.findIndex((o) => o.id === owner) * STEP;
  const offset = (i: Island) =>
    (islands.indexOf(i) - (islands.length - 1) / 2) * 0.63;
  const tickStep = period === 'all' ? 50 : 25;
  const ticks = Array.from(
    { length: Math.ceil((range[1] - range[0]) / tickStep) + 1 },
    (_, k) => Math.ceil(range[0] / tickStep) * tickStep + k * tickStep,
  ).filter((t) => t >= range[0] && t <= range[1]);
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
          <span className="atlas-mark" aria-hidden="true">
            ✳
          </span>
          <span>
            CARIBBEAN
            <span className="wordmark-sub">AN ATLAS OF SHIFTING POWER</span>
          </span>
        </button>
        <div className="masthead-right">
          <ThemeSwitcher />
          <span>1450 — 2026</span>
          <button
            onClick={() => {
              setEvidence(!evidence);
              document
                .getElementById('sources-method')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Sources & method <Arrow />
          </button>
        </div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">ISLANDS. EMPIRES. INDEPENDENCE.</p>
          <h1>
            A sea of empires<span>.</span>
          </h1>
        </div>
        <div className="intro-copy">
          <p>
            Small islands. Enormous stakes. Follow the Caribbean through
            centuries of conquest, occupation, treaties and the struggle for
            independence.
          </p>
          <p className="quiet">
            Each line is an island’s history. Each turn is a shift in power.
          </p>
        </div>
      </section>
      <nav className="stories" aria-label="Stories to explore">
        {stories.map((s) => (
          <button
            key={s.id}
            className={selected === s.id ? 'story active' : 'story'}
            onClick={() => preset(s)}
          >
            <span className="story-number">{s.number}</span>
            <span>{s.label}</span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </nav>
      <section
        className="explorer"
        id="explorer"
        aria-label="Interactive history atlas"
      >
        <div className="chart-side">
          <div className="chart-heading">
            <div>
              <span className="eyebrow">THE CHANGING CARIBBEAN</span>
              <h2>
                {mode === 'administration'
                  ? 'Who held the reins?'
                  : 'Who held the title?'}
              </h2>
            </div>
            <span className="coverage">
              <strong>{islands.length}</strong> tracks <span> / </span>{' '}
              <strong>{new Set(islands.map((i) => i.place)).size}</strong>{' '}
              places
            </span>
          </div>
          <div className="toolbar">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList aria-label="What the lines represent">
                <TabsTrigger value="administration">Administration</TabsTrigger>
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
          <div className="time-control">
            <div>
              <span id="time-label">Explore a year</span>
              <output>{Math.floor(year)}</output>
            </div>
            <Slider
              value={[Math.max(range[0], Math.min(Math.floor(year), range[1]))]}
              min={range[0]}
              max={range[1]}
              step={1}
              thumbLabel="Year to explore"
              onValueChange={(v) => {
                setYear(typeof v === 'number' ? v : v[0]);
                setEventId('');
                setTip(null);
              }}
            />
            <span className="year-state">
              {current.name} <strong>{owners[atYear].label}</strong>
            </span>
          </div>
          {view === 'chart' ? (
            <>
              <div
                className="chart-scroll"
                ref={chartRef}
                role="region"
                aria-label="History chart. Scroll horizontally on smaller screens. Use the island selector or table for keyboard access."
                tabIndex={0}
                onPointerLeave={() => {
                  setHovered(null);
                  setTip(null);
                }}
              >
                <svg
                  className="history-chart"
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
                    linear time axis. Parallel lines within a row have no ranked
                    meaning. Select an island in the list or use the Table view
                    for its dated and cited chronology.{' '}
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
                  {data.contexts
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
                          height={H - TOP + 4}
                          fill={
                            c.id === 'independence'
                              ? 'var(--era-free)'
                              : 'var(--era-fill)'
                          }
                          opacity={c.id === 'independence' ? 0.045 : 0.035}
                        />
                        {(period !== 'all' ||
                          ['seven-years', 'independence'].includes(c.id)) && (
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
                        y1={TOP - 24}
                        y2={H - 24}
                        className="year-grid"
                      />
                      <text
                        x={x(t)}
                        y={TOP - 31}
                        textAnchor="middle"
                        className="year-label"
                      >
                        {t}
                      </text>
                    </g>
                  ))}
                  {ownerRows.map((o) => (
                    <g key={o.id}>
                      <line
                        x1={L}
                        x2={W - R}
                        y1={y(o.id)}
                        y2={y(o.id)}
                        className="owner-grid"
                      />
                      <circle
                        cx={13}
                        cy={y(o.id) - 1}
                        r={3.3}
                        fill={`light-dark(${o.color}, color-mix(in srgb, ${o.color} 70%, white))`}
                      />
                      <text
                        x={24}
                        y={y(o.id) + 4}
                        className={`owner-label ${focus && changes(focus, mode).some((e) => (mode === 'administration' ? e.resultingController : e.resultingSovereign) === o.id) ? 'owner-used' : ''}`}
                      >
                        {o.label}
                      </text>
                    </g>
                  ))}
                  <g clipPath="url(#plot-clip)">
                    {ordered.map((i) => {
                      const active = i.id === focus?.id;
                      const yy = (o: string) => y(o) + offset(i);
                      const path = historyPath(i, mode, range, x, yy);
                      return (
                        <g
                          key={i.id}
                          className={`island-path ${active ? 'is-active' : ''}`}
                        >
                          <path
                            d={path}
                            fill="none"
                            stroke={color(i)}
                            strokeWidth={active ? 2.8 : 1.15}
                            opacity={active ? 1 : focus ? 0.28 : 0.72}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                          <path
                            d={path}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={8}
                            onPointerEnter={() => setHovered(i.id)}
                            onClick={() => selectIsland(i.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <circle
                            cx={x(range[1])}
                            cy={yy(stateAt(i, range[1], mode))}
                            r={active ? 3.5 : 1.6}
                            fill={color(i)}
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
                                const box =
                                  chartRef.current?.getBoundingClientRect();
                                if (box)
                                  setTip({
                                    island: focus,
                                    event: e,
                                    x: Math.min(
                                      ev.clientX -
                                        box.left +
                                        chartRef.current!.scrollLeft +
                                        12,
                                      W - 300,
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
                                r={e.id === eventId ? 5 : 3.7}
                                fill={
                                  e.kind === 'claim'
                                    ? 'var(--paper)'
                                    : color(focus)
                                }
                                stroke={
                                  e.kind === 'claim'
                                    ? color(focus)
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
                                  stroke={color(focus)}
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
                          y2={H - 24}
                          stroke="var(--ink)"
                          strokeWidth={1}
                          strokeDasharray="3 5"
                          opacity={0.5}
                        />
                      </g>
                    )}
                  </g>
                  <text x={L} y={H - 5} className="chart-footnote">
                    {period === 'all'
                      ? '← Indigenous histories extend millennia before this chart.'
                      : 'Linear time scale. Treaty dates and handovers may differ.'}
                  </text>
                  <text
                    x={W - R}
                    y={H - 5}
                    textAnchor="end"
                    className="chart-footnote"
                  >
                    {range[1]} →
                  </text>
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
              <div className="chart-legend">
                <span>
                  <i
                    className="legend-line"
                    style={{ background: focus ? color(focus) : undefined }}
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
                  {[
                    'All islands',
                    ...new Set(islands.map((i) => i.region)),
                  ].map((g) => (
                    <SelectItem value={g} key={g}>
                      {g}
                    </SelectItem>
                  ))}
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
                  onPointerEnter={() => setHovered(i.id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i.id)}
                  onBlur={() => setHovered(null)}
                  onClick={() => selectIsland(i.id)}
                >
                  <span style={{ background: color(i) }} />
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
        </div>
        <aside className="inspector" aria-label="Selected island details">
          <div className="inspector-sticky">
            <div className="island-eyebrow">
              <span className="eyebrow">ISLAND IN FOCUS</span>
              <span className="island-index">
                {String(islands.indexOf(current) + 1).padStart(2, '0')} /{' '}
                {islands.length}
              </span>
            </div>
            <Select
              value={selected}
              onValueChange={(v) => {
                if (v) selectIsland(v);
              }}
              items={Object.fromEntries(islands.map((i) => [i.id, i.name]))}
            >
              <SelectTrigger
                className="island-select"
                aria-label="Select island"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...islands]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((i) => (
                    <SelectItem value={i.id} key={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
              <p className="eyebrow">{current.region}</p>
              <IslandMap island={current} year={year} mode={mode} />
              <p className="coordinates">
                {Math.abs(current.coordinates[1]).toFixed(2)}° N &nbsp;{' '}
                {Math.abs(current.coordinates[0]).toFixed(2)}° W
              </p>
              <p className="map-people">{current.peoples}</p>
            </div>
            <div className="event-card" aria-live="polite" aria-atomic="true">
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
                  <span aria-hidden="true"> → </span>
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
                  <span>Reading the evidence</span>
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
                  ← Previous
                </button>
                <span>
                  {current.events.indexOf(event) + 1} / {current.events.length}
                </span>
                <button
                  disabled={
                    current.events.indexOf(event) === current.events.length - 1
                  }
                  onClick={() =>
                    selectEvent(
                      current.events[current.events.indexOf(event) + 1],
                    )
                  }
                >
                  Next →
                </button>
              </div>
            </div>
            <details className="island-notes">
              <summary>The history behind the line</summary>
              <p>{current.notes}</p>
              <Cite ids={current.sources} />
            </details>
            <div className="event-list-heading">
              <h3>Follow the chronology</h3>
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
                      <i style={{ background: color(current) }} />
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
        </aside>
      </section>
      <section className="context-strip">
        <span className="eyebrow">BEHIND THE BORDERS</span>
        <h2>
          Power changed hands.
          <br />
          People made history.
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
            <span className="eyebrow">A NOTE ON THE RECORD</span>
            <h2>The evidence behind every turn.</h2>
          </div>
          <div className="downloads">
            <a href="/data/caribbean.json" download>
              Dataset · JSON ↓
            </a>
            <a href="/data/events.csv" download>
              Chronology · CSV ↓
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
            <strong>Precision without pretence.</strong> {activeEventCount}{' '}
            records cite {data.sources.length} sources. Circa dates and
            disagreements are flagged. This is a curated chronology of major
            transitions, not every raid or outpost. Detailed colonial dates
            often rely on secondary compilations.
          </p>
        </div>
        <details
          open={evidence}
          onToggle={(e) => setEvidence(e.currentTarget.open)}
        >
          <summary>
            Bibliography & editorial notes{' '}
            <span>{data.sources.length} sources ↗</span>
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
        <span>A SEA OF EMPIRES</span>
        <p>Historical facts. Human consequences.</p>
        <span>Research edition · 2026</span>
      </footer>
    </main>
  );
}
