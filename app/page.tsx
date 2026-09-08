/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs its image role; the labeled scroll region has an explicit accessible role. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to focus and scroll the chart. */
'use client';
import { Fragment, useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowUpRight,
  ChevronDown,
  Circle,
  Diamond,
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { YearRange } from '@/components/year-range';
import { IslandMap } from '@/components/island-map';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Cite } from '@/components/citations';
import { HistoryChart } from '@/components/history-chart';
import { IslandPicker } from '@/components/island-picker';
import { plottedEvent, type Arrangement, type Period } from '@/lib/periods';
import { eventAxis } from '@/lib/event-axis';
import { calendarRange, yearPresets } from '@/lib/year-range';
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
} from '@/lib/history';

const repository = 'https://github.com/jamesgpearce/contestedworlds';

const ranges: Record<string, [number, number]> = Object.fromEntries(
  yearPresets.map((preset) => [preset.id, [preset.start, preset.end]]),
);
function Arrow() {
  return <ArrowUpRight className="inline-icon" aria-hidden="true" />;
}
function DisclosureIcon() {
  return (
    <ChevronDown className="disclosure-chevron" size={14} aria-hidden="true" />
  );
}

export default function Home() {
  const [selected, setSelected] = useState('saint-lucia');
  const [selectedIds, setSelectedIds] = useState(() =>
    islands.map((island) => island.id),
  );
  const [arrangement, setArrangement] = useState<Arrangement>('powers');
  const [mode, setMode] = useState<Mode>('administration');
  const [yearRange, setYearRange] = useState<[number, number]>(ranges.all);
  const range = useMemo(() => calendarRange(yearRange), [yearRange]);
  const [pinned, setPinned] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [eventId, setEventId] = useState('saint-lucia-12');
  const [showClaims, setShowClaims] = useState(true);
  const [showQualified, setShowQualified] = useState(true);
  const [year, setYear] = useState(dateValue('1763-02-10'));
  const [axisSpacing, setAxisSpacing] = useState('events');
  const [evidence, setEvidence] = useState(false);
  const current = islands.find((i) => i.id === selected) || islands[0];
  const tracks = useMemo(
    () => islands.filter((i) => selectedIds.includes(i.id)),
    [selectedIds],
  );
  const activeArrangement = tracks.length > 1 ? arrangement : 'powers';
  const period =
    Object.keys(ranges).find(
      (key) =>
        ranges[key][0] === yearRange[0] && ranges[key][1] === yearRange[1],
    ) || 'custom';
  const changeRange = (next: [number, number]) => {
    setPinned(false);
    setYearRange([...next]);
    const bounds = calendarRange(next);
    setYear((value) => Math.max(bounds[0], Math.min(value, bounds[1])));
    setEventId('');
  };
  const activeEventCount = data.islands.reduce(
    (n, i) => n + i.events.length,
    0,
  );
  const selectEvent = (e: HistoryEvent, reveal = false) => {
    setPinned(true);
    if (reveal) setFocusRequest((value) => value + 1);
    setEventId(e.id);
    setYear(dateValue(e.date));
    if (dateValue(e.date) < range[0] || dateValue(e.date) > range[1])
      setYearRange(ranges.all);
  };
  const changeSelection = (ids: string[]) => {
    setSelectedIds(ids);
    if (!ids.includes(selected)) setPinned(false);
    if (ids.length && !ids.includes(selected)) {
      setSelected(ids[0]);
      setEventId('');
    }
  };
  const selectPeriod = (p: Period) => {
    setPinned(true);
    setSelected(p.islandId);
    setYear(p.start);
    setEventId(p.event?.id || '');
  };
  useEffect(
    () =>
      registerAtlasTools(({ islandId, year, mode }) => {
        flushSync(() => {
          setPinned(true);
          setFocusRequest((value) => value + 1);
          setSelected(islandId);
          setSelectedIds([islandId]);
          setYear(year);
          setMode(mode);
          setYearRange(ranges.all);
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
  const openReference = (id: string) => {
    const element = document.getElementById(id);
    if (id === 'bibliography') setEvidence(true);
    else if (element instanceof HTMLDetailsElement) element.open = true;
    requestAnimationFrame(() =>
      element?.scrollIntoView({ behavior: 'smooth' }),
    );
  };
  return (
    <main>
      <a className="skip-link" href="#explorer">
        Skip to the island explorer
      </a>
      <header className="masthead">
        <div className="atlas-title">
          <h1>
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M2 2h16v12h-8v16H2Z" />
              <path d="M22 2h8v28H14V18h8Z" />
            </svg>
            <span className="brand-name">
              Contested <span>Worlds</span>
            </span>
          </h1>
          <div className="atlas-subtitle">
            <p>
              Caribbean islands through conquest, occupation and independence.
            </p>
            <nav className="subtitle-references" aria-label="Atlas references">
              {[
                ['Context', 'regional-history'],
                ['Sources', 'bibliography'],
                ['Method', 'sources-method'],
              ].map(([label, id], n) => (
                <Fragment key={id}>
                  {n > 0 && (
                    <span className="reference-separator" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      openReference(id);
                    }}
                  >
                    {label}
                  </a>
                </Fragment>
              ))}
            </nav>
          </div>
        </div>
        <ThemeSwitcher />
      </header>
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
                    <p className="chart-option-label">X-axis spacing</p>
                    <Tabs
                      value={axisSpacing}
                      onValueChange={(value) => setAxisSpacing(String(value))}
                    >
                      <TabsList aria-label="X-axis evenly spaces">
                        <TabsTrigger value="time">Time</TabsTrigger>
                        <TabsTrigger value="events">Events</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <p className="chart-option-help">
                      {axisSpacing === 'events'
                        ? 'Equal gaps between relevant event dates for the selected islands.'
                        : 'Equal gaps represent equal spans of time.'}
                    </p>
                  </div>
                  <div className="chart-option-field">
                    <p className="chart-option-label">Time period</p>
                    <Select
                      value={period}
                      onValueChange={(v) => {
                        if (v && ranges[v]) changeRange(ranges[v]);
                      }}
                      items={{
                        ...Object.fromEntries(
                          yearPresets.map((preset) => [
                            preset.id,
                            preset.title,
                          ]),
                        ),
                        custom: 'Custom range',
                      }}
                    >
                      <SelectTrigger aria-label="Time period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="range-presets">
                        {period === 'custom' && (
                          <SelectItem value="custom" disabled>
                            Custom range
                          </SelectItem>
                        )}
                        {yearPresets.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.title} · {preset.start}–{preset.end}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <YearRange range={yearRange} onChange={changeRange} />
                  </div>
                  <div className="marker-options">
                    <label className="marker-option" htmlFor="show-claims">
                      <Checkbox
                        id="show-claims"
                        checked={showClaims}
                        onCheckedChange={setShowClaims}
                      />
                      <span>Claim markers</span>
                      <Diamond size={12} aria-hidden="true" />
                    </label>
                    <label className="marker-option" htmlFor="show-qualified">
                      <Checkbox
                        id="show-qualified"
                        checked={showQualified}
                        onCheckedChange={setShowQualified}
                      />
                      <span>Qualified changes</span>
                      <Circle size={10} aria-hidden="true" />
                    </label>
                  </div>
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
                showQualified={showQualified}
                inspectedId={selected}
                eventId={eventId}
                year={year}
                pinned={pinned}
                focusRequest={focusRequest}
                onDismiss={() => setPinned(false)}
                onSelect={selectPeriod}
                onClaim={(island, e) => {
                  setSelected(island.id);
                  selectEvent(e);
                }}
              />
            </>
          )}
        </div>
        {pinned && selectedIds.includes(selected) && (
          <details
            key={current.id}
            className="island-reference"
            id="island-background"
            open
          >
            <summary>
              <DisclosureIcon />
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
                        href="#explorer"
                        className={e.id === eventId ? 'active' : ''}
                        onClick={(click) => {
                          click.preventDefault();
                          selectEvent(e, true);
                        }}
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
      <section className="evidence" aria-label="Atlas references">
        <details className="war-context" id="regional-history">
          <summary>
            <DisclosureIcon />
            <h2>Context</h2>
          </summary>
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
        <details
          id="bibliography"
          open={evidence}
          onToggle={(e) => setEvidence(e.currentTarget.open)}
        >
          <summary>
            <DisclosureIcon />
            <h2>Sources</h2>
            <span>{data.sources.length} sources</span>
          </summary>
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
        <details id="sources-method" className="editorial-method" open>
          <summary>
            <DisclosureIcon />
            <h2>Method</h2>
          </summary>
          <p className="contribution-note">
            <strong>Open source. Corrections welcome.</strong> The code is
            MIT-licensed and the dataset is CC BY 4.0. Found a missing event, a
            date to correct, or a better source?{' '}
            <a
              href={`${repository}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noreferrer"
            >
              Make a pull request against the dataset
            </a>{' '}
            on GitHub. Each island has an editable JSON file; no chart code
            changes are needed.
          </p>
          <div className="method-grid">
            <p>
              <strong>
                {new Set(islands.map((i) => i.place)).size} places.{' '}
                {islands.length} histories.
              </strong>{' '}
              The places in the original scope include sovereign states and
              dependencies. Islands with divergent histories get separate
              tracks. Groups and principal-island proxies are identified in
              their notes.
            </p>
            <p>
              <strong>Claims are not control.</strong> A European claim does not
              erase Indigenous sovereignty. Occupation, legal title and
              independence are different events. The shared row includes
              disputed, concurrent or interrupted administrations; it is not
              another empire.
            </p>
            <p>
              <strong>Dates and uncertainty.</strong> {activeEventCount} records
              cite {data.sources.length} sources. Circa dates and disagreements
              are flagged. This is a curated chronology of major transitions,
              not every raid or outpost. Detailed colonial dates often rely on
              secondary compilations.
            </p>
          </div>
          <details className="power-key reference-key">
            <summary>
              <DisclosureIcon />
              Powers &amp; flags
            </summary>
            <p>
              Flags identify powers and island rows using modern designs; they
              do not change with historical dates. UK includes earlier English
              rule. The Order of Malta uses its eight-pointed cross. Lettermarks
              identify Courland and Gran Colombia. Indigenous societies and
              independent states have no single national flag. Island rows use
              contemporary country or territory flags, so some islands share a
              national flag. The Caribbean Netherlands use the Dutch flag.
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
              . Order emblem:{' '}
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
        </details>
      </section>
      <footer>
        <span>Contested Worlds · Caribbean</span>

        <a href={repository} target="_blank" rel="noreferrer">
          Open source on GitHub <Arrow />
        </a>
        <span>© 2026 James Pearce</span>
      </footer>
    </main>
  );
}
