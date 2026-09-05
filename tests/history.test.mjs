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
