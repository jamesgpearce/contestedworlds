'use client';
import { assetPath, repository } from '@/lib/site-config';
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
import { useAtlasView } from '@/lib/use-atlas-view';
import {
  detailForPeriod,
  readAtlasView,
  resolveAtlasDetail,
} from '@/lib/atlas-url';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  periodsFor,
  plottedEvent,
  type Arrangement,
  type Period,
} from '@/lib/periods';
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

const ranges: Record<string, [number, number]> = Object.fromEntries(
  yearPresets.map((preset) => [preset.id, [preset.start, preset.end]]),
);
const Arrow = () => <ArrowUpRight className="inline-icon" aria-hidden="true" />;
const DisclosureIcon = () => (
  <ChevronDown className="disclosure-chevron" size={14} aria-hidden="true" />
);

export default function Home() {
  const [view, updateView, viewReady] = useAtlasView();
  const {
    selectedIds,
    arrangement,
    mode,
    yearRange,
    showClaims,
    showQualified,
    axisSpacing,
  } = view;
  const [lastSelected, setLastSelected] = useState('saint-lucia');
  const pinnedTarget = useMemo(() => resolveAtlasDetail(view), [view]);
  const selected = pinnedTarget?.islandId || lastSelected;
  const pinned = !!pinnedTarget;
  const eventId = pinnedTarget?.eventId || '';
  const year = pinnedTarget?.year ?? yearRange[0];
  const range = useMemo(() => calendarRange(yearRange), [yearRange]);
  const [revealRequest, setRevealRequest] = useState(0);
  const [evidence, setEvidence] = useState(false);
  const tracks = useMemo(
    () => islands.filter((i) => selectedIds.includes(i.id)),
    [selectedIds],
  );
  const current =
    tracks.find((i) => i.id === selected) || tracks[0] || islands[0];
  const activeArrangement = tracks.length > 1 ? arrangement : 'powers';
  const period =
    Object.keys(ranges).find(
      (key) =>
        ranges[key][0] === yearRange[0] && ranges[key][1] === yearRange[1],
    ) || 'custom';
  const changeRange = (next: [number, number]) => {
    updateView({ yearRange: [...next], detail: null });
  };
  const activeEventCount = data.islands.reduce(
    (n, i) => n + i.events.length,
    0,
  );
  const selectEvent = (e: HistoryEvent, reveal = false) => {
    const island = islands.find((island) =>
      island.events.some((event) => event.id === e.id),
    );
    if (!island) return;
    setLastSelected(island.id);
    if (reveal) setRevealRequest((value) => value + 1);
    updateView({
      detail: e.id,
      ...(e.kind === 'claim' ? { showClaims: true } : {}),
      ...(dateValue(e.date) < range[0] || dateValue(e.date) > range[1]
        ? { yearRange: ranges.all }
        : {}),
    });
  };
  const changeSelection = (ids: string[]) => {
    updateView({ selectedIds: ids });
    if (ids.length && !ids.includes(selected)) setLastSelected(ids[0]);
  };
  const selectPeriod = (p: Period) => {
    setLastSelected(p.islandId);
    updateView({ detail: detailForPeriod(p) });
  };
  useEffect(
    () =>
      registerAtlasTools(({ islandId, year, mode }) => {
        flushSync(() => {
          setRevealRequest((value) => value + 1);
          setLastSelected(islandId);
          const island = islands.find((island) => island.id === islandId)!;
          const period = periodsFor(
            island,
            mode,
            calendarRange(ranges.all),
          ).find((period) => period.start <= year && period.end > year);
          updateView({
            selectedIds: [islandId],
            mode,
            yearRange: ranges.all,
            detail: period ? detailForPeriod(period) : null,
          });
        });
      }),
    [updateView],
  );
  useEffect(() => {
    const revealSharedDetail = () => {
      if (readAtlasView(window.location.search).detail)
        setRevealRequest((value) => value + 1);
    };
    revealSharedDetail();
    window.addEventListener('popstate', revealSharedDetail);
    return () => window.removeEventListener('popstate', revealSharedDetail);
  }, []);
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
        aria-busy={!viewReady}
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
                inspected={current.id}
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
                    updateView({ arrangement: value as Arrangement })
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
                      onValueChange={(v) =>
                        updateView({ mode: v as Mode, detail: null })
                      }
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
                      onValueChange={(value) =>
                        updateView({ axisSpacing: value as 'events' | 'time' })
                      }
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
                    <select
                      className="range-presets"
                      data-slot="select-trigger"
                      aria-label="Time period"
                      value={period}
                      onChange={(event) => {
                        const next = event.currentTarget.value;
                        if (ranges[next]) changeRange(ranges[next]);
                      }}
                    >
                      {period === 'custom' && (
                        <option value="custom">Custom range</option>
                      )}
                      {yearPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.title} · {preset.start}–{preset.end}
                        </option>
                      ))}
                    </select>
                    <YearRange range={yearRange} onChange={changeRange} />
                  </div>
                  <div className="marker-options">
                    <label className="marker-option" htmlFor="show-claims">
                      <Checkbox
                        id="show-claims"
                        checked={showClaims}
                        onCheckedChange={(showClaims) =>
                          updateView({ showClaims })
                        }
                      />
                      <span>Claim markers</span>
                      <Diamond size={12} aria-hidden="true" />
                    </label>
                    <label className="marker-option" htmlFor="show-qualified">
                      <Checkbox
                        id="show-qualified"
                        checked={showQualified}
                        onCheckedChange={(showQualified) =>
                          updateView({ showQualified })
                        }
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
                viewReady={viewReady}
                tracks={tracks}
                mode={mode}
                range={range}
                arrangement={activeArrangement}
                spacing={axisSpacing}
                scale={eventScale}
                showClaims={showClaims}
                showQualified={showQualified}
                pinnedTarget={pinnedTarget}
                revealRequest={revealRequest}
                onDismiss={() => updateView({ detail: null })}
                onSelect={selectPeriod}
                onClaim={(_, e) => selectEvent(e)}
                onShowIsland={({ island, period, standalone }) => {
                  setLastSelected(island.id);
                  setRevealRequest((value) => value + 1);
                  updateView({
                    selectedIds: [island.id],
                    detail: standalone?.id || detailForPeriod(period),
                  });
                }}
              />
            </>
          )}
        </div>
        {(tracks.length === 1 ||
          (pinned && selectedIds.includes(selected))) && (
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
            <a href={assetPath('/data/caribbean.json')} download>
              Dataset · JSON{' '}
              <Download className="inline-icon" aria-hidden="true" />
            </a>
            <a href={assetPath('/data/events.csv')} download>
              Chronology · CSV{' '}
              <Download className="inline-icon" aria-hidden="true" />
            </a>
          </div>
          <p className="bibliography-intro">
            Compiled 6 September 2026. Treaty editions, local museums,
            government histories and scholarship are supplemented by specialist
            chronologies. A citation establishes provenance, not a claim of
            archival certainty.{' '}
            <a href={assetPath('/data/editorial-notes.json')} download>
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
          <div className="method-intro">
            <p>
              <strong>What is this?</strong> While traveling through the
              Caribbean, I realized how little I knew about the historical
              imperial chessboard of these islands, and how, for centuries, they
              had lain at the center of global geopolitics. I hope this
              infographic conveys just how complex, surprising, and often tragic
              their histories have been.
            </p>
            <p>
              <strong>Open source. Corrections welcome.</strong> The code is
              MIT-licensed and the dataset is CC BY 4.0. Found a missing event,
              a date to correct, or a better source?{' '}
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
          </div>
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
        <span>
          © 2026{' '}
          <a
            href="https://github.com/jamesgpearce"
            target="_blank"
            rel="noreferrer"
          >
            James Pearce
          </a>
        </span>
      </footer>
    </main>
  );
}
