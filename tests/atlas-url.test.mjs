import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  ).toString('base64')}`;
const raw = await read('../lib/caribbean.json');
const history = moduleUrl(
  (await read('../lib/history.ts')).replace(
    "import raw from './caribbean.json';",
    `const raw = ${raw};`,
  ),
);
const {
  defaultAtlasView,
  readAtlasView,
  atlasViewUrl,
  islandUrlOrder,
  createAtlasUrlStore,
} = await import(
  moduleUrl(
    (await read('../lib/atlas-url.ts')).replace(
      "'./history'",
      JSON.stringify(history),
    ),
  )
);
const origin = 'https://example.com/atlas';
const fromUrl = (url) => readAtlasView(new URL(url, origin).search);
const roundTrip = (view) => fromUrl(atlasViewUrl(origin, view));

test('The default view has a bare URL; an empty selection is explicit', () => {
  const defaults = defaultAtlasView();
  assert.equal(atlasViewUrl(origin, defaults), '/atlas');
  assert.deepEqual(fromUrl('/atlas'), defaults);
  const empty = { ...defaults, selectedIds: [] };
  assert.equal(atlasViewUrl(origin, empty), '/atlas?islands=none');
  assert.deepEqual(roundTrip(empty), empty);
});

test('Every island and older encoded links survive sharing', () => {
  const defaults = defaultAtlasView();
  assert.equal(new Set(islandUrlOrder).size, islandUrlOrder.length);
  assert.deepEqual(new Set(islandUrlOrder), new Set(defaults.selectedIds));
  for (const id of defaults.selectedIds) {
    const view = { ...defaults, selectedIds: [id] };
    assert.deepEqual(roundTrip(view), view);
  }
  assert.deepEqual(readAtlasView('?i=1.35u').selectedIds, [
    'cuba',
    'saint-lucia',
  ]);
  assert.deepEqual(
    readAtlasView('?i=1.vkhsvlr').selectedIds,
    defaults.selectedIds,
  );
});

test('Published island bit positions remain stable as data evolves', () => {
  assert.deepEqual(islandUrlOrder.slice(0, 36), [
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
  ]);
});

test('Readable selections combine whole regions and individual islands', () => {
  const selected = readAtlasView('?islands=greater-antilles,saint-lucia,cuba');
  assert.deepEqual(selected.selectedIds, [
    'haiti',
    'cuba',
    'dominican',
    'puerto-rico',
    'jamaica',
    'saint-lucia',
  ]);
  assert.equal(
    atlasViewUrl(origin, selected),
    '/atlas?islands=greater-antilles,saint-lucia',
  );
  assert.equal(
    atlasViewUrl(origin, readAtlasView('?islands=cuba,saint-lucia')),
    '/atlas?islands=cuba,saint-lucia',
  );
  assert.deepEqual(readAtlasView('?islands=unknown,cuba').selectedIds, [
    'cuba',
  ]);
  assert.deepEqual(readAtlasView('?islands=unknown'), defaultAtlasView());
  assert.deepEqual(readAtlasView('?islands=all'), defaultAtlasView());
  assert.deepEqual(readAtlasView('?islands=none&i=1.2').selectedIds, []);
  for (const region of [
    ...new Set(JSON.parse(raw).islands.map((island) => island.region)),
  ]) {
    const members = JSON.parse(raw)
      .islands.filter((island) => island.region === region)
      .map((island) => island.id);
    assert.deepEqual(
      readAtlasView(`?islands=${region.toLowerCase().replaceAll(' ', '-')}`)
        .selectedIds,
      members,
    );
    assert.deepEqual(
      roundTrip({ ...defaultAtlasView(), selectedIds: members }).selectedIds,
      members,
    );
  }
});

test('All options and varied multi-island selections round-trip without losing precision', () => {
  const defaults = defaultAtlasView();
  let seed = 6143;
  for (let n = 0; n < 64; n++) {
    const view = {
      selectedIds: defaults.selectedIds.filter(() => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed % 3 === 0;
      }),
      arrangement: n & 1 ? 'islands' : 'powers',
      mode: n & 2 ? 'sovereignty' : 'administration',
      axisSpacing: n & 4 ? 'time' : 'events',
      yearRange: n & 8 ? [1600, 1850] : defaults.yearRange,
      showClaims: Boolean(n & 16),
      showQualified: Boolean(n & 32),
    };
    assert.deepEqual(roundTrip(view), view);
    assert.equal(
      atlasViewUrl(origin, {
        ...view,
        selectedIds: [...view.selectedIds].reverse(),
      }),
      atlasViewUrl(origin, view),
    );
  }
  assert.deepEqual(
    roundTrip({ ...defaults, yearRange: [1763, 1763] }).yearRange,
    [1763, 1763],
  );
});

test('Malformed and unsupported fields fall back independently', () => {
  const defaults = defaultAtlasView();
  for (const value of ['bad', '2.0', '1.-1', '1.12!', `1.${'z'.repeat(100)}`])
    assert.deepEqual(
      readAtlasView(`?i=${value}`).selectedIds,
      defaults.selectedIds,
    );
  for (const years of [
    '1800-1600',
    '1449-1800',
    '1600-9999',
    '1600.5-1800',
    '1600',
  ]) {
    const view = readAtlasView(`?y=${years}&a=t&g=i&m=s&c=0&q=0`);
    assert.deepEqual(view.yearRange, defaults.yearRange);
    assert.equal(view.axisSpacing, 'time');
    assert.equal(view.arrangement, 'islands');
    assert.equal(view.mode, 'sovereignty');
    assert.equal(view.showClaims, false);
    assert.equal(view.showQualified, false);
  }
  assert.deepEqual(readAtlasView('?a=bad&g=bad&m=bad&c=bad&q=bad'), defaults);
});

test('Rewriting a view preserves unrelated query parameters and reference anchors', () => {
  const view = defaultAtlasView();
  assert.equal(
    atlasViewUrl(
      `${origin}?utm_source=friend&i=1.2&g=i&a=t&m=s&y=1600-1800&c=0&q=0#bibliography`,
      view,
    ),
    '/atlas?utm_source=friend#bibliography',
  );
});

function browserAt(href) {
  let location = new URL(href);
  const listeners = new Set();
  const writes = [];
  const routeState = { framework: { key: 'keep-this' } };
  const browser = {
    get location() {
      return location;
    },
    history: {
      state: routeState,
      replaceState(state, _, href) {
        assert.equal(state, routeState);
        writes.push(href);
        location = new URL(href, location);
      },
    },
    addEventListener(type, listener) {
      assert.equal(type, 'popstate');
      listeners.add(listener);
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'popstate');
      listeners.delete(listener);
    },
  };
  return {
    browser,
    writes,
    listeners,
    navigate(href) {
      location = new URL(href, location);
      listeners.forEach((listener) => listener());
    },
  };
}

test('First read restores a link without rewriting it; subsequent edits survive refresh', () => {
  const env = browserAt(`${origin}?i=1.35u&a=t#sources-method`);
  const store = createAtlasUrlStore(env.browser);
  const initial = store.getSnapshot();
  assert.deepEqual(initial.selectedIds, ['cuba', 'saint-lucia']);
  assert.equal(initial.axisSpacing, 'time');
  assert.equal(store.getSnapshot(), initial);
  assert.equal(env.writes.length, 0);
  let received;
  const unsubscribe = store.subscribe(() => {
    received = store.getSnapshot();
  });
  store.update({ yearRange: [1700, 1900], showClaims: false });
  assert.equal(received, store.getSnapshot());
  store.update({ arrangement: 'islands' });
  assert.deepEqual(
    createAtlasUrlStore(env.browser).getSnapshot(),
    store.getSnapshot(),
  );
  assert.equal(env.browser.location.hash, '#sources-method');
  store.update({ arrangement: 'islands' });
  assert.equal(
    env.writes.length,
    2,
    'No duplicate history write for an unchanged URL',
  );
  unsubscribe();
  assert.equal(env.listeners.size, 0);
});

test('Back/forward restoration and later edits use the navigated view', () => {
  const env = browserAt(origin);
  const store = createAtlasUrlStore(env.browser);
  const unsubscribe = store.subscribe(() => store.getSnapshot());
  store.update({ showQualified: false });
  env.navigate('/atlas?i=1.2&m=s&c=0');
  assert.deepEqual(store.getSnapshot().selectedIds, ['cuba']);
  assert.equal(store.getSnapshot().showQualified, true);
  store.update((view) => ({ showClaims: !view.showClaims }));
  assert.equal(env.browser.location.search, '?islands=cuba&m=s');
  env.navigate('/atlas');
  assert.deepEqual(store.getSnapshot(), defaultAtlasView());
  unsubscribe();
});
