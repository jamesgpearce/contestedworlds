import { islands, START, END, dateValue, type Mode } from './history';
import {
  periodsFor,
  plottedEvent,
  type Arrangement,
  type Period,
} from './periods';
import { calendarRange } from './year-range';
import type { InspectionTarget } from './chart-inspection';

export const urlRegions: Record<string, string> = {
  'greater-antilles': 'Greater Antilles',
  'southern-caribbean': 'Southern Caribbean',
  'lucayan-archipelago': 'Lucayan Archipelago',
  'lesser-antilles': 'Lesser Antilles',
  'virgin-islands': 'Virgin Islands',
  'western-caribbean': 'Western Caribbean',
};

// ISO country/territory codes, with atlas suffixes for separately plotted islands.
// https://unstats.un.org/unsd/methodology/m49/overview/
export const islandUrlCodes: Record<string, string> = {
  haiti: 'ht',
  cuba: 'cu',
  dominican: 'do',
  'puerto-rico': 'pr',
  jamaica: 'jm',
  trinidad: 'tt-tr',
  tobago: 'tt-to',
  bahamas: 'bs',
  guadeloupe: 'gp',
  martinique: 'mq',
  barbados: 'bb',
  curacao: 'cw',
  'saint-lucia': 'lc',
  grenada: 'gd',
  aruba: 'aw',
  'saint-vincent': 'vc',
  'saint-croix': 'vi-c',
  'saint-thomas': 'vi-t',
  'saint-john': 'vi-j',
  antigua: 'ag-a',
  barbuda: 'ag-b',
  dominica: 'dm',
  cayman: 'ky',
  'saint-kitts': 'kn-k',
  nevis: 'kn-n',
  'turks-caicos': 'tc',
  'sint-maarten': 'sx',
  'saint-martin': 'mf',
  'british-virgins': 'vg',
  bonaire: 'bq-bo',
  anguilla: 'ai',
  'saint-barts': 'bl',
  montserrat: 'ms',
  'sint-eustatius': 'bq-se',
  saba: 'bq-sa',
  'nueva-esparta': 've',
};
const islandsByCode = new Map(
  Object.entries(islandUrlCodes).map(([id, code]) => [code, id]),
);

function encodeDetail(detail: string): string {
  const island = islands.find(
    (island) =>
      detail === `${island.id}.initial` ||
      island.events.some((event) => event.id === detail),
  )!;
  return `${islandUrlCodes[island.id]}.${detail === `${island.id}.initial` ? 'initial' : detail.slice(island.id.length + 1)}`;
}
function decodeDetail(value: string | null): string | null {
  const parts = value?.toLowerCase().split('.');
  if (!parts || parts.length !== 2) return null;
  const id = islandsByCode.get(parts[0]);
  if (!id) return null;
  return parts[1] === 'initial' ? `${id}.initial` : `${id}-${parts[1]}`;
}

export type AtlasView = {
  selectedIds: string[];
  arrangement: Arrangement;
  mode: Mode;
  yearRange: [number, number];
  axisSpacing: 'events' | 'time';
  showClaims: boolean;
  showQualified: boolean;
  detail: string | null;
};

export function defaultAtlasView(): AtlasView {
  return {
    selectedIds: islands.map((island) => island.id),
    arrangement: 'powers',
    mode: 'administration',
    yearRange: [START, END],
    axisSpacing: 'events',
    showClaims: true,
    showQualified: true,
    detail: null,
  };
}

export function detailForPeriod(period: Period): string {
  return period.event?.id || `${period.islandId}.initial`;
}

/** Resolve a stable record identity, never an array index or rounded year. */
export function resolveAtlasDetail(view: AtlasView): InspectionTarget | null {
  if (!view.detail) return null;
  const island = islands.find(
    (island) =>
      view.detail === `${island.id}.initial` ||
      island.events.some((event) => event.id === view.detail),
  );
  if (!island || !view.selectedIds.includes(island.id)) return null;
  const range = calendarRange(view.yearRange);
  const periods = periodsFor(island, view.mode, range);
  const period = periods.find(
    (period) => detailForPeriod(period) === view.detail,
  );
  if (period)
    return {
      islandId: island.id,
      periodId: period.id,
      eventId: period.event?.id,
      year: period.start,
    };
  const event = island.events.find((event) => event.id === view.detail);
  if (
    !event ||
    plottedEvent(event, view.mode) ||
    (event.kind === 'claim' && !view.showClaims)
  )
    return null;
  const year = dateValue(event.date);
  if (year < range[0] || year > range[1]) return null;
  return { islandId: island.id, eventId: event.id, year };
}

function decodeIslands(value: string | null): string[] | undefined {
  if (value === null) return;
  const tokens = new Set(
    value
      .toLowerCase()
      .split(',')
      .map((token) => token.trim()),
  );
  if (tokens.has('all')) return islands.map((island) => island.id);
  if (tokens.size === 1 && tokens.has('none')) return [];
  const regions = new Set(
    [...tokens].map((token) => urlRegions[token]).filter(Boolean),
  );
  const selected = islands.filter((island) => {
    const code = islandUrlCodes[island.id];
    return (
      tokens.has(code) ||
      tokens.has(code.split('-')[0]) ||
      regions.has(island.region)
    );
  });
  return selected.length ? selected.map((island) => island.id) : undefined;
}

function countryTokens(ids: Set<string>): string[] {
  const tokens = new Set<string>();
  for (const island of islands.filter((island) => ids.has(island.id))) {
    const code = islandUrlCodes[island.id],
      country = code.split('-')[0];
    const wholeCountry = islands.every(
      (member) =>
        islandUrlCodes[member.id].split('-')[0] !== country ||
        ids.has(member.id),
    );
    tokens.add(wholeCountry ? country : code);
  }
  return [...tokens];
}

function encodeIslands(ids: string[]) {
  let remaining = new Set(ids);
  const regions: string[] = [];
  for (const [slug, region] of Object.entries(urlRegions)) {
    const members = islands.filter((island) => island.region === region);
    if (!members.length || !members.every((island) => remaining.has(island.id)))
      continue;
    const rest = new Set(remaining);
    members.forEach((island) => rest.delete(island.id));
    // Prefer a region only when it shortens the full list, including shared countries.
    if (
      [slug, ...countryTokens(rest)].join(',').length <
      countryTokens(remaining).join(',').length
    ) {
      regions.push(slug);
      remaining = rest;
    }
  }
  return [...regions, ...countryTokens(remaining)].join(',') || 'none';
}

/** Invalid fields fall back independently, leaving the rest of a link usable. */
export function readAtlasView(search: string): AtlasView {
  const params = new URLSearchParams(search);
  const view = defaultAtlasView();
  view.selectedIds = decodeIslands(params.get('islands')) ?? view.selectedIds;
  if (params.get('g') === 'i') view.arrangement = 'islands';
  if (params.get('a') === 't') view.axisSpacing = 'time';
  if (params.get('m') === 's') view.mode = 'sovereignty';
  if (params.get('c') === '0') view.showClaims = false;
  if (params.get('q') === '0') view.showQualified = false;
  const years = params.get('y')?.match(/^(\d{4})-(\d{4})$/);
  if (years) {
    const start = Number(years[1]),
      end = Number(years[2]);
    if (start >= START && end <= END && start <= end)
      view.yearRange = [start, end];
  }
  view.detail = decodeDetail(params.get('detail'));
  if (!resolveAtlasDetail(view)) view.detail = null;
  return view;
}

/** Own only our query keys: preserve unrelated parameters and section anchors. */
export function atlasViewUrl(href: string, view: AtlasView): string {
  const url = new URL(href);
  for (const key of ['islands', 'g', 'a', 'm', 'y', 'c', 'q', 'detail'])
    url.searchParams.delete(key);
  const selected = new Set(view.selectedIds);
  if (!islands.every((island) => selected.has(island.id))) {
    url.searchParams.set('islands', encodeIslands(view.selectedIds));
  }
  if (view.arrangement === 'islands') url.searchParams.set('g', 'i');
  if (view.axisSpacing === 'time') url.searchParams.set('a', 't');
  if (view.mode === 'sovereignty') url.searchParams.set('m', 's');
  if (view.yearRange[0] !== START || view.yearRange[1] !== END)
    url.searchParams.set('y', view.yearRange.join('-'));
  if (!view.showClaims) url.searchParams.set('c', '0');
  if (!view.showQualified) url.searchParams.set('q', '0');
  if (view.detail && resolveAtlasDetail(view))
    url.searchParams.set('detail', encodeDetail(view.detail));
  return `${url.pathname}${url.search.replaceAll('%2C', ',')}${url.hash}`;
}

type ViewUpdate =
  | Partial<AtlasView>
  | ((view: AtlasView) => Partial<AtlasView>);
type Browser = Pick<
  Window,
  'location' | 'history' | 'addEventListener' | 'removeEventListener'
>;

/** The URL is the source of truth; no mount effect can overwrite a shared link. */
export function createAtlasUrlStore(browser: Browser) {
  let search = browser.location.search;
  let snapshot = readAtlasView(search);
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const getSnapshot = () => {
    if (search !== browser.location.search) {
      search = browser.location.search;
      snapshot = readAtlasView(search);
    }
    return snapshot;
  };
  return {
    getSnapshot,
    subscribe(listener: () => void) {
      if (!listeners.size) browser.addEventListener('popstate', notify);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (!listeners.size) browser.removeEventListener('popstate', notify);
      };
    },
    update(change: ViewUpdate) {
      const previous = getSnapshot();
      const next = {
        ...previous,
        ...(typeof change === 'function' ? change(previous) : change),
      };
      if (!resolveAtlasDetail(next)) next.detail = null;
      const href = atlasViewUrl(browser.location.href, next);
      const current = browser.location;
      if (href !== `${current.pathname}${current.search}${current.hash}`)
        browser.history.replaceState(browser.history.state, '', href);
      search = browser.location.search;
      snapshot = next;
      notify();
    },
  };
}
