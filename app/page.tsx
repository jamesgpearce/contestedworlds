/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs its image role; the labeled scroll region has an explicit accessible role. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to focus and scroll the chart. */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, ChevronDown, Download } from 'lucide-react';
import { registerAtlasTools } from '@/lib/atlas-tools';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { IslandMap } from '@/components/island-map';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Cite } from '@/components/citations';
import { HistoryChart } from '@/components/history-chart';
import { IslandPicker } from '@/components/island-picker';
import { plottedEvent, type Arrangement, type Period } from '@/lib/periods';
import { eventAxis } from '@/lib/event-axis';
import { PowerSymbol } from '@/components/power-symbol';
import {
  data,
  islands,
  owners,
  type HistoryEvent,
  type Mode,
  dateValue,
  eventDate,
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
function Arrow() {
  return <ArrowUpRight className="inline-icon" aria-hidden="true" />;
}

export default function Home() {
  const [selected, setSelected] = useState('saint-lucia');
  const [selectedIds, setSelectedIds] = useState([
    'saint-lucia',
    'saint-vincent',
    'tobago',
    'saba',
  ]);
  const [arrangement, setArrangement] = useState<Arrangement>('powers');
  const [mode, setMode] = useState<Mode>('administration');
  const [period, setPeriod] = useState('all');
  const [eventId, setEventId] = useState('saint-lucia-12');
  const [showClaims, setShowClaims] = useState(false);
  const [year, setYear] = useState(dateValue('1763-02-10'));
  const [axisSpacing, setAxisSpacing] = useState('events');
  const [evidence, setEvidence] = useState(false);
  const current = islands.find((i) => i.id === selected) || islands[0];
  const tracks = useMemo(
    () => islands.filter((i) => selectedIds.includes(i.id)),
    [selectedIds],
  );
  const activeArrangement = tracks.length > 1 ? arrangement : 'powers';
  const range = ranges[period];
  const activeEventCount = data.islands.reduce(
    (n, i) => n + i.events.length,
    0,
  );
  const selectEvent = (e: HistoryEvent) => {
    setEventId(e.id);
    setYear(dateValue(e.date));
    if (dateValue(e.date) < range[0] || dateValue(e.date) > range[1])
      setPeriod('all');
  };
  const changeSelection = (ids: string[]) => {
    setSelectedIds(ids);
    if (ids.length && !ids.includes(selected)) {
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
              setEvidence(true);
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
              />
              <span className="coverage">
                {tracks.reduce((n, i) => n + changeCount(i, mode, range), 0)}{' '}
                changes in view
              </span>
            </div>
            <div className="chart-view-controls">
              {tracks.length > 1 && (
                <Tabs
                  value={activeArrangement}
                  onValueChange={(value) =>
                    setArrangement(value as Arrangement)
                  }
                >
                  <TabsList aria-label="Group periods by">
                    <TabsTrigger value="islands">By Island</TabsTrigger>
                    <TabsTrigger value="powers">By Power</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              <Tabs
                className="axis-toggle"
                value={axisSpacing}
                onValueChange={(value) => setAxisSpacing(String(value))}
              >
                <TabsList aria-label="Horizontal spacing">
                  <TabsTrigger value="time">Time</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>
              </Tabs>
              <Popover>
                <PopoverTrigger
                  className="chart-options-trigger"
                  id="chart-options"
                >
                  Options{' '}
                  <ChevronDown className="inline-icon" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent
                  className="chart-options-panel"
                  align="end"
                  sideOffset={8}
                >
                  <PopoverTitle className="sr-only">Chart options</PopoverTitle>
                  <div className="chart-option-field">
                    <p className="chart-option-label">Periods represent</p>
                    <Tabs
                      value={mode}
                      onValueChange={(v) => setMode(v as Mode)}
                    >
                      <TabsList aria-label="What the periods represent">
                        <TabsTrigger value="administration">
                          Administration
                        </TabsTrigger>
                        <TabsTrigger value="sovereignty">
                          Sovereign title
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <p className="chart-option-help">
                      {mode === 'administration'
                        ? 'Colonial governments and substantial military occupations.'
                        : 'Recorded sovereign status. Occupation can change the government without changing the title.'}
                    </p>
                  </div>
                  <div className="chart-option-field">
                    <p className="chart-option-label">Time period</p>
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
                  </div>
                  {tracks.length > 0 && (
                    <div className="chart-option-field year-option">
                      <p className="chart-option-label">
                        Explore a year <output>{Math.floor(year)}</output>
                      </p>
                      <Slider
                        value={[
                          eventSpacing
                            ? eventScale.position(year) *
                              (eventScale.domain.length - 1)
                            : Math.max(
                                range[0],
                                Math.min(Math.floor(year), range[1]),
                              ),
                        ]}
                        min={eventSpacing ? 0 : range[0]}
                        max={
                          eventSpacing ? eventScale.domain.length - 1 : range[1]
                        }
                        step={1}
                        thumbLabel={
                          eventSpacing ? 'Event to explore' : 'Year to explore'
                        }
                        thumbValueText={cursorLabel}
                        onValueChange={(v) => {
                          const value = typeof v === 'number' ? v : v[0];
                          setYear(
                            eventSpacing
                              ? eventScale.domain[Math.round(value)]
                              : value,
                          );
                          setEventId('');
                        }}
                      />
                    </div>
                  )}
                  <button
                    className="overview-toggle"
                    aria-pressed={showClaims}
                    onClick={() => setShowClaims(!showClaims)}
                  >
                    {showClaims ? 'Hide' : 'Show'} claim markers
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {!tracks.length ? (
            <div className="chart-empty" role="status">
              <h3>No islands selected</h3>
              <p>Choose islands or a whole region from the menu above.</p>
              <button
                className="text-button"
                onClick={() => changeSelection(islands.map((i) => i.id))}
              >
                Show all {islands.length} islands
              </button>
            </div>
          ) : (
            <>
              <HistoryChart
                tracks={tracks}
                mode={mode}
                range={range}
                arrangement={activeArrangement}
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
            </>
          )}
        </div>
        {tracks.length > 0 && (
          <details className="island-reference" id="island-background">
            <summary>
              About {current.name}
              <span>
                Background &amp; {current.events.length} dated records
              </span>
            </summary>
            <div className="island-reference-body">
              <div className="reference-background">
                <p>{current.notes}</p>
                <p className="reference-peoples">{current.peoples}</p>
                <Cite ids={current.sources} />
                <p className="reference-location">
                  {current.region} · Today:{' '}
                  {owners[current.currentSovereign].label}
                </p>
                <div className="reference-map">
                  <IslandMap island={current} year={year} mode={mode} />
                </div>
              </div>
              <div className="reference-chronology">
                <h3>Dated records</h3>
                <ol className="event-list">
                  {current.events.map((e) => (
                    <li key={e.id}>
                      <a
                        href="#selected-event"
                        className={e.id === eventId ? 'active' : ''}
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
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </details>
        )}
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
        <details className="war-context">
          <summary>Regional history</summary>
          <p className="regional-intro">
            Sugar, strategic harbours and Atlantic trade made these islands
            imperial prizes. Their wealth was built through Indigenous
            dispossession and the labour of enslaved Africans. The chart traces
            political power; Indigenous peoples, cultures and resistance endured
            beyond it. <Cite ids={['regional', 'survival']} />
          </p>
          <div>
            {data.contexts.map((c) => (
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
        <details className="power-key reference-key">
          <summary>Powers &amp; flags</summary>
          <p>
            Flags identify powers using modern designs; they do not change with
            historical dates. UK includes earlier English rule. Lettermarks
            identify Courland and Gran Colombia. Indigenous societies and
            independent states have no single national flag.
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
