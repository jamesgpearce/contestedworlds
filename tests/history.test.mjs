import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
import ts from 'typescript';

// Execute the actual plotting module, without a browser or a second implementation.
const input = await readFile(
  new URL('../src/lib/history.ts', import.meta.url),
  'utf8',
);
const json = await readFile(
  new URL('../src/lib/caribbean.json', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(
  input.replace(
    "import { atlasData } from './atlas-data';\nconst [raw] = await atlasData;",
    `const raw = ${json};`,
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { islands, stateAt, dateValue, eventDate, changeCount } = await import(
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

test('Change counts use dated control or title records within the chosen period', () => {
  const guadeloupe = island('guadeloupe');
  assert.equal(changeCount(guadeloupe, 'administration', [1813, 1813.999]), 0);
  assert.equal(changeCount(guadeloupe, 'sovereignty', [1813, 1813.999]), 1);
  for (const i of islands) {
    assert.equal(
      changeCount(i, 'administration', [1450, 2026]),
      i.controlChanges,
    );
    assert.equal(changeCount(i, 'administration', [2027, 2030]), 0);
  }
});
