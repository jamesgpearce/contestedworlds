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
const periodsModule = moduleUrl(
  (await read('../lib/periods.ts')).replace(
    "'./history'",
    JSON.stringify(history),
  ),
);
const yearRangeModule = moduleUrl(
  (await read('../lib/year-range.ts')).replace(
    "'./history'",
    JSON.stringify(history),
  ),
);
const {
  defaultAtlasView,
  readAtlasView,
  atlasViewUrl,
  islandUrlOrder,
  createAtlasUrlStore,
  detailForPeriod,
  resolveAtlasDetail,
} = await import(
  moduleUrl(
    (await read('../lib/atlas-url.ts'))
      .replace("'./history'", JSON.stringify(history))
      .replace("'./periods'", JSON.stringify(periodsModule))
      .replace("'./year-range'", JSON.stringify(yearRangeModule)),
  )
);
const { periodsFor } = await import(periodsModule);
const { islands, dateValue } = await import(history);
const { calendarRange } = await import(yearRangeModule);
const { inspectTarget } = await import(
  moduleUrl(
    (await read('../lib/chart-inspection.ts'))
      .replaceAll("'./history'", JSON.stringify(history))
      .replace("'./periods'", JSON.stringify(periodsModule)),
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
      detail: null,
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

test('Every rectangle restores the same card identity in either political mode', () => {
  for (const mode of ['administration', 'sovereignty']) {
    const view = { ...defaultAtlasView(), mode };
    const range = calendarRange(view.yearRange);
    for (const island of islands) {
      const periods = periodsFor(island, mode, range);
      for (const period of periods) {
        const shared = roundTrip({ ...view, detail: detailForPeriod(period) });
        const card = inspectTarget(
          resolveAtlasDetail(shared),
          [island],
          periods,
          mode,
          range,
        );
        assert.equal(card?.period.id, period.id);
        assert.equal(card?.event?.id, period.event?.id);
      }
    }
  }
});

test('Claim links restore claim metadata, including exact dates', () => {
  for (const mode of ['administration', 'sovereignty']) {
    const view = { ...defaultAtlasView(), mode };
    const range = calendarRange(view.yearRange);
    for (const island of islands) {
      for (const event of island.events.filter(
        (event) => event.kind === 'claim',
      )) {
        const shared = roundTrip({ ...view, detail: event.id });
        const target = resolveAtlasDetail(shared);
        const card = inspectTarget(
          target,
          [island],
          periodsFor(island, mode, range),
          mode,
          range,
        );
        assert.equal(card?.event.id, event.id);
        assert.equal(card?.standalone?.kind, 'claim');
        assert.equal(target.year, dateValue(event.date));
      }
    }
  }
});

test('Initial and clipped rectangles retain identity without date approximations', () => {
  const initial = readAtlasView('?islands=dominica&detail=dominica.initial');
  assert.equal(resolveAtlasDetail(initial).periodId, 'dominica:initial');
  const island = islands.find((island) => island.id === 'saint-lucia');
  const view = defaultAtlasView();
  const period = periodsFor(
    island,
    view.mode,
    calendarRange(view.yearRange),
  ).find(
    (period) => period.originalStart > 1600 && period.end - period.start > 5,
  );
  const clipped = roundTrip({
    ...view,
    yearRange: [Math.ceil(period.start) + 1, Math.floor(period.end) - 1],
    detail: detailForPeriod(period),
  });
  assert.equal(resolveAtlasDetail(clipped).periodId, period.id);
  assert.equal(resolveAtlasDetail(clipped).year, clipped.yearRange[0]);
});

test('Pinned details survive refresh and navigation; dismissal and invalidated targets clear them', () => {
  const env = browserAt(`${origin}?islands=dominica&detail=dominica.initial`);
  const store = createAtlasUrlStore(env.browser);
  const unsubscribe = store.subscribe(() => store.getSnapshot());
  const initial = store.getSnapshot();
  store.update({ axisSpacing: 'time' });
  assert.equal(store.getSnapshot().detail, initial.detail);
  assert.deepEqual(
    createAtlasUrlStore(env.browser).getSnapshot(),
    store.getSnapshot(),
  );
  const periods = periodsFor(
    islands.find((island) => island.id === 'dominica'),
    initial.mode,
    calendarRange(initial.yearRange),
  );
  store.update({ detail: detailForPeriod(periods[1]) });
  assert.equal(resolveAtlasDetail(store.getSnapshot()).periodId, periods[1].id);
  store.update({ detail: null });
  assert.equal(env.browser.location.searchParams.has('detail'), false);
  env.navigate('/atlas?islands=dominica&detail=dominica.initial');
  assert.equal(store.getSnapshot().detail, 'dominica.initial');
  store.update({ selectedIds: ['cuba'] });
  assert.equal(store.getSnapshot().detail, null);
  env.navigate('/atlas?islands=dominica&detail=dominica.initial');
  store.update({ yearRange: [1900, 2000] });
  assert.equal(store.getSnapshot().detail, null);
  env.navigate('/atlas?islands=cuba&detail=cuba-01');
  store.update({ showClaims: false });
  assert.equal(store.getSnapshot().detail, null);
  for (const query of [
    'detail=unknown',
    'detail=cuba-999',
    'detail=bogus.initial',
    'islands=cuba&detail=dominica.initial',
  ])
    assert.equal(readAtlasView(`?${query}`).detail, null);
  unsubscribe();
});
