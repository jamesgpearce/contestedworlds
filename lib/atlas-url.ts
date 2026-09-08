import { islands, START, END, type Mode } from './history';
import type { Arrangement } from './periods';

export const urlRegions: Record<string, string> = {
  'greater-antilles': 'Greater Antilles',
  'southern-caribbean': 'Southern Caribbean',
  'lucayan-archipelago': 'Lucayan Archipelago',
  'lesser-antilles': 'Lesser Antilles',
  'virgin-islands': 'Virgin Islands',
  'western-caribbean': 'Western Caribbean',
};

// Read-only compatibility with the original links. Never reorder these positions.
export const islandUrlOrder = [
  'haiti',
  'cuba',
  'dominican',
  'puerto-rico',
  'jamaica',
  'trinidad',
  'tobago',
  'bahamas',
  'guadeloupe',
  'martinique',
  'barbados',
  'curacao',
  'saint-lucia',
  'grenada',
  'aruba',
  'saint-vincent',
  'saint-croix',
  'saint-thomas',
  'saint-john',
  'antigua',
  'barbuda',
  'dominica',
  'cayman',
  'saint-kitts',
  'nevis',
  'turks-caicos',
  'sint-maarten',
  'saint-martin',
  'british-virgins',
  'bonaire',
  'anguilla',
  'saint-barts',
  'montserrat',
  'sint-eustatius',
  'saba',
  'nueva-esparta',
] as const;

export type AtlasView = {
  selectedIds: string[];
  arrangement: Arrangement;
  mode: Mode;
  yearRange: [number, number];
  axisSpacing: 'events' | 'time';
  showClaims: boolean;
  showQualified: boolean;
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
  };
}

function decodeLegacyIslands(value: string | null): string[] | undefined {
  if (!value || !/^1\.[0-9a-z]{1,32}$/.test(value)) return;
  let mask = BigInt(0);
  for (const digit of value.slice(2))
    mask = mask * BigInt(36) + BigInt(parseInt(digit, 36));
  const selected = new Set<string>(
    islandUrlOrder.filter(
      (_, index) => (mask & (BigInt(1) << BigInt(index))) !== BigInt(0),
    ),
  );
  // Newer links can contain islands not yet present in this dataset.
  return islands
    .filter((island) => selected.has(island.id))
    .map((island) => island.id);
}

function decodeIslands(value: string | null): string[] | undefined {
  if (value === null) return;
  if (value === 'none') return [];
  const tokens = new Set(value.split(',').map((token) => token.trim()));
  if (tokens.has('all')) return islands.map((island) => island.id);
  const regions = new Set(
    [...tokens].map((token) => urlRegions[token]).filter(Boolean),
  );
  const selected = islands.filter(
    (island) => tokens.has(island.id) || regions.has(island.region),
  );
  return selected.length ? selected.map((island) => island.id) : undefined;
}

function encodeIslands(ids: string[]) {
  const selected = new Set(ids);
  const tokens: string[] = [];
  for (const [slug, region] of Object.entries(urlRegions)) {
    const members = islands.filter((island) => island.region === region);
    if (
      members.length > 1 &&
      members.every((island) => selected.has(island.id))
    ) {
      tokens.push(slug);
      members.forEach((island) => selected.delete(island.id));
    }
  }
  tokens.push(
    ...islands
      .filter((island) => selected.has(island.id))
      .map((island) => island.id),
  );
  return tokens.join(',') || 'none';
}

/** Invalid fields fall back independently, leaving the rest of a link usable. */
export function readAtlasView(search: string): AtlasView {
  const params = new URLSearchParams(search);
  const view = defaultAtlasView();
  view.selectedIds =
    (params.has('islands')
      ? decodeIslands(params.get('islands'))
      : decodeLegacyIslands(params.get('i'))) ?? view.selectedIds;
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
  return view;
}

/** Own only our query keys: preserve unrelated parameters and section anchors. */
export function atlasViewUrl(href: string, view: AtlasView): string {
  const url = new URL(href);
  for (const key of ['islands', 'i', 'g', 'a', 'm', 'y', 'c', 'q'])
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
