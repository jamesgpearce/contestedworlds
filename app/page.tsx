/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs its image role; the labeled scroll region has an explicit accessible role. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to focus and scroll the chart. */
'use client';
import { useState, useEffect, useMemo } from 'react';
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
import { HistoryChart } from '@/components/history-chart';
import { IslandPicker } from '@/components/island-picker';
import { plottedEvent, type Arrangement, type Period } from '@/lib/periods';
import { eventAxis } from '@/lib/event-axis';
import { PowerSymbol } from '@/components/power-symbol';
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
  type HistoryEvent,
  type Mode,
  changes,
  stateAt,
  dateValue,
  eventDate,
  historyPath,
  changeCount,
  powerColor,
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
    1.6,
  );
  return (
    <svg className="story-trace" viewBox="0 0 96 32" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function Home() {
  const [selected, setSelected] = useState('saint-lucia');
  const [selectedIds, setSelectedIds] = useState([
    'saint-lucia',
    'saint-vincent',
    'tobago',
    'saba',
  ]);
  const [arrangement, setArrangement] = useState<Arrangement>('islands');
  const [mode, setMode] = useState<Mode>('administration');
  const [period, setPeriod] = useState('all');
  const [view, setView] = useState('chart');
  const [eventId, setEventId] = useState('saint-lucia-12');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All islands');
  const [showClaims, setShowClaims] = useState(false);
  const [year, setYear] = useState(dateValue('1763-02-10'));
  const [axisSpacing, setAxisSpacing] = useState('time');
  const [evidence, setEvidence] = useState(false);
  const current = islands.find((i) => i.id === selected) || islands[0];
  const tracks = useMemo(
    () => islands.filter((i) => selectedIds.includes(i.id)),
    [selectedIds],
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
    setSelectedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setEventId('');
  };
  const selectEvent = (e: HistoryEvent) => {
    setEventId(e.id);
    setYear(dateValue(e.date));
  };
  const changeSelection = (ids: string[]) => {
    if (!ids.length) return;
    setSelectedIds(ids);
    if (!ids.includes(selected)) {
      setSelected(ids[0]);
      setEventId('');
    }
  };
  const selectPeriod = (p: Period) => {
    setSelected(p.islandId);
    setYear(p.start);
    setEventId(p.event?.id || '');
  };
  useEffect(
    () =>
      registerAtlasTools(({ islandId, year, mode }) => {
        flushSync(() => {
          setSelected(islandId);
          setSelectedIds([islandId]);
          setYear(year);
          setMode(mode);
          setPeriod('all');
          setView('chart');
          setGroup('All islands');
          setQuery('');
          setEventId('');
        });
      }),
    [],
  );
  const eventScale = useMemo(
    () =>
      eventAxis(
        range,
        tracks.flatMap((i) =>
          i.events
            .filter((e) => plottedEvent(e, mode, showClaims))
            .map((e) => dateValue(e.date)),
        ),
      ),
    [range, tracks, mode, showClaims],
  );
  const eventSpacing = axisSpacing === 'events';
  const dateUnderCursor = tracks
    .flatMap((i) => i.events)
    .find((e) => dateValue(e.date) === year);
  const cursorLabel = dateUnderCursor
    ? eventDate(dateUnderCursor)
    : String(Math.floor(year));
  const selectedInRange = current.events.filter(
    (e) => dateValue(e.date) >= range[0] && dateValue(e.date) <= range[1],
  );
  const atYear = stateAt(current, year, mode);
  function preset(s: (typeof stories)[number]) {
    setSelected(s.id);
    setSelectedIds([s.id]);
    setArrangement('powers');
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
              <IslandPicker
                ids={selectedIds}
                inspected={selected}
                onChange={changeSelection}
                onInspect={selectIsland}
              />
              <span className="coverage">
                {tracks.reduce((n, i) => n + changeCount(i, mode, range), 0)}{' '}
                changes in view
              </span>
            </div>
            <div className="chart-view-controls">
              <Tabs
                value={arrangement}
                onValueChange={(v) => setArrangement(v as Arrangement)}
              >
                <TabsList aria-label="Group periods by">
                  <TabsTrigger value="islands">Islands</TabsTrigger>
                  <TabsTrigger value="powers">Powers</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs
                className="axis-toggle"
                value={axisSpacing}
                onValueChange={(v) => {
                  setAxisSpacing(String(v));
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
          </div>
          {view === 'chart' ? (
            <>
              <HistoryChart
                tracks={tracks}
                mode={mode}
                range={range}
                arrangement={arrangement}
                spacing={axisSpacing}
                scale={eventScale}
                showClaims={showClaims}
                inspectedId={selected}
                eventId={eventId}
                year={year}
                onSelect={selectPeriod}
                onClaim={(island, e) => {
                  setSelected(island.id);
                  selectEvent(e);
                }}
              />
              <p className="chart-scale-note">
                {eventSpacing
                  ? 'Event spacing · equal gaps between relevant dates for the selected islands, not equal years. Shared dates share a tick.'
                  : 'Linear time · Indigenous histories extend millennia before 1450.'}
              </p>
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
              }}
            />
            <span className="year-state">
              {current.name} <strong>{owners[atYear].label}</strong>
            </span>
          </div>
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
                <TabsList aria-label="What the periods represent">
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
                  ? 'Colonial governments and substantial military occupations. Claims appear as separate markers.'
                  : 'Recorded sovereign status. Occupation can change the government without changing the title.'}
              </p>
            </div>
            <div className="claim-option">
              {' '}
              <button
                className="overview-toggle"
                aria-pressed={showClaims}
                onClick={() => setShowClaims(!showClaims)}
              >
                {showClaims ? 'Hide' : 'Show'} claim markers
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
            <summary>The wars behind the changes</summary>
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
                  {current.name} ·{' '}
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
              <details className="island-notes" id="island-background">
                <summary>The history behind the periods</summary>
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
                        <i
                          style={{
                            background: powerColor(
                              mode === 'administration'
                                ? e.resultingController
                                : e.resultingSovereign,
                            ),
                          }}
                        />
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
            <h3>Add or remove islands</h3>
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
                aria-pressed={selectedIds.includes(i.id)}
                className={
                  selectedIds.includes(i.id)
                    ? 'island-chip selected'
                    : 'island-chip'
                }
                disabled={selectedIds.length === 1 && selectedIds[0] === i.id}
                onClick={() =>
                  changeSelection(
                    selectedIds.includes(i.id)
                      ? selectedIds.filter((id) => id !== i.id)
                      : [...selectedIds, i.id],
                  )
                }
              >
                <span
                  style={{ background: powerColor(stateAt(i, year, mode)) }}
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
            The chart traces political power. It cannot contain the lives,
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
