import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Execute the actual plotting module, without a browser or a second implementation.
const input = await readFile(
  new URL('../lib/history.ts', import.meta.url),
  'utf8',
);
const json = await readFile(
  new URL('../lib/caribbean.json', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(
  input.replace(
    /import raw from ['"].\/caribbean.json['"];?/,
    `const raw = ${json};`,
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { islands, data, stateAt, historyPath, dateValue, eventDate } =
  await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
  );
const island = (id) => islands.find((i) => i.id === id);

test('Guadeloupe in 1813: British administration, Swedish title', () => {
  assert.equal(
    stateAt(island('guadeloupe'), 1813.5, 'administration'),
    'britain',
  );
  assert.equal(stateAt(island('guadeloupe'), 1813.5, 'sovereignty'), 'sweden');
});
test('Haitian occupation does not imply annexation', () => {
  assert.equal(stateAt(island('haiti'), 1920, 'administration'), 'usa');
  assert.equal(stateAt(island('haiti'), 1920, 'sovereignty'), 'independent');
  assert.equal(stateAt(island('haiti'), 1935, 'administration'), 'independent');
});
test('Havana occupation does not transfer all of Cuba', () => {
  assert.equal(stateAt(island('cuba'), 1762.9, 'administration'), 'spain');
});
test('Basel changes title before Santo Domingo changes government', () => {
  assert.equal(stateAt(island('dominican'), 1798, 'administration'), 'spain');
  assert.equal(stateAt(island('dominican'), 1798, 'sovereignty'), 'france');
});
test('Changing powers takes effect on the date, never on 1 January by accident', () => {
  const when = dateValue('1979-02-22');
  assert.equal(
    stateAt(island('saint-lucia'), when - 0.000001, 'administration'),
    'britain',
  );
  assert.equal(
    stateAt(island('saint-lucia'), when, 'administration'),
    'independent',
  );
});
test('All paths are finite, monotonic in time, and end in the correct row', () => {
  for (const mode of ['administration', 'sovereignty']) {
    for (const range of [
      [1450, 2026],
      [1600, 1820],
      [1790, 2026],
    ]) {
      const x = (n) => ((n - range[0]) / (range[1] - range[0])) * 1000;
      const y = (id) => data.owners.findIndex((o) => o.id === id) * 40;
      for (const i of islands) {
        const path = historyPath(i, mode, range, x, y);
        assert.ok(!/NaN|undefined|Infinity/.test(path), i.id);
        const times = [...path.matchAll(/H([\d.]+)/g)].map((m) => Number(m[1]));
        assert.ok(times.every((t, n) => t >= (times[n - 1] ?? 0) && t <= 1000));
        assert.equal(times.at(-1), 1000);
        const rows = [...path.matchAll(/[MV](?:[\d.]+,)?([\d.]+)/g)].map((m) =>
          Number(m[1]),
        );
        assert.equal(rows.at(-1), y(stateAt(i, range[1], mode)));
      }
    }
  }
});
test('Display preserves month, year, and circa precision', () => {
  assert.equal(
    eventDate({ date: '1804', year: 1804, precision: 'year' }),
    '1804',
  );
  assert.equal(
    eventDate({ date: '1690', year: 1690, precision: 'circa' }),
    'c. 1690',
  );
  assert.equal(
    eventDate({ date: '1804-10', year: 1804, precision: 'month' }),
    'Oct 1804',
  );
});

const layoutSource = await readFile(
  new URL('../lib/chart-layout.ts', import.meta.url),
  'utf8',
);
const layoutJS = ts.transpileModule(layoutSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022 },
}).outputText;
const { chartLayout } = await import(
  `data:text/javascript;base64,${Buffer.from(layoutJS).toString('base64')}`
);

test('Responsive projection keeps every history inside the phone and desktop plot', () => {
  for (const [width, height] of [
    [292, 337],
    [347, 401],
    [362, 539],
    [720, 580],
    [1376, 645],
  ]) {
    for (const mode of ['administration', 'sovereignty']) {
      for (const range of [
        [1450, 2026],
        [1600, 1820],
        [1790, 2026],
      ]) {
        const layout = chartLayout(width, height, range, data.owners.length);
        assert.ok(layout.step >= 20, 'Power labels need distinct rows');
        assert.equal(layout.x(range[0]), layout.left);
        assert.equal(layout.x(range[1]), width - layout.right);
        for (const [index, island] of islands.entries()) {
          const y = (id) =>
            layout.y(data.owners.findIndex((o) => o.id === id)) +
            (index - (islands.length - 1) / 2) * layout.laneStep;
          const path = historyPath(island, mode, range, layout.x, y, 5);
          assert.ok(!/NaN|undefined|Infinity/.test(path));
          for (const [, x] of path.matchAll(/H([\d.]+)/g))
            assert.ok(+x >= layout.left && +x <= width - layout.right);
          for (const [, y] of path.matchAll(/[MV](?:[\d.]+,)?([\d.]+)/g))
            assert.ok(+y >= 0 && +y <= height);
        }
      }
    }
  }
});
test('Responsive date ticks retain both endpoints without overlapping', () => {
  for (const width of [292, 347, 362, 720, 1376]) {
    for (const range of [
      [1450, 2026],
      [1600, 1820],
      [1790, 2026],
    ]) {
      const { ticks, x } = chartLayout(width, 400, range, data.owners.length);
      assert.equal(ticks[0], range[0]);
      assert.equal(ticks.at(-1), range[1]);
      for (let n = 1; n < ticks.length; n++)
        assert.ok(x(ticks[n]) - x(ticks[n - 1]) >= 48);
    }
  }
});

test('Rounded bends stay on dated transitions and shrink around close events', () => {
  const events = [1600, 1601, 1700, 1700, 1800].map((year, index) => ({
    date: String(year),
    changesControl: true,
    resultingController: index % 2 ? 'spain' : 'france',
    controller: index % 2 ? 'spain' : 'france',
  }));
  const sample = { initialController: 'spain', events };
  const path = historyPath(
    sample,
    'administration',
    [1450, 1800],
    (n) => n,
    (s) => (s === 'spain' ? 0 : 40),
    5,
  );
  const curves = [
    ...path.matchAll(/Q([\d.]+),([\d.]+) ([\d.]+),([\d.]+)/g),
  ].map((m) => m.slice(1).map(Number));
  assert.equal(
    curves.length,
    4,
    'Only the two separated transitions have curved elbows',
  );
  for (const [cx, cy, ex, ey] of curves) {
    assert.ok(
      cx === 1600 || cx === 1601,
      'Bezier control stays on the actual event date',
    );
    assert.ok(
      Math.abs(ex - cx) <= 0.5 && Math.abs(ey - cy) <= 0.5,
      'One-year gap caps each bend at half a unit',
    );
    assert.ok(
      cy >= 0 && cy <= 40 && ey >= 0 && ey <= 40,
      'Bends never overshoot their rows',
    );
  }
  assert.ok(
    path.includes('H1700V40H1700V0'),
    'Same-day changes remain sharp, preserving their sequence',
  );
  assert.ok(
    path.endsWith('H1800V40H1800'),
    'A transfer at the right endpoint cannot curve beyond the range',
  );
});
