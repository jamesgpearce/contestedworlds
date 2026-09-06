import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(
  new URL('../lib/event-axis.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { eventAxis } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);

test('Event spacing shares simultaneous dates and preserves the selected range', () => {
  const axis = eventAxis(
    [1600, 1820],
    [1900, 1763, 1600, 1763, 1750, 1599, 1802, 1820],
  );
  assert.deepEqual(axis.domain, [1600, 1750, 1763, 1802, 1820]);
  axis.domain.forEach((date, n) => assert.equal(axis.position(date), n / 4));
  assert.deepEqual(eventAxis([1600, 1820], []).domain, [1600, 1820]);
});
test('Event interpolation stays monotonic and reverses accurately for year navigation', () => {
  const axis = eventAxis([1450, 2026], [1627, 1763.1, 1763.2, 1804, 1979]);
  let previous = -1;
  for (let date = 1450; date <= 2026; date += 0.1) {
    const fraction = axis.position(date);
    assert.ok(fraction >= previous && fraction >= 0 && fraction <= 1);
    assert.ok(Math.abs(axis.at(fraction) - date) < 1e-9);
    previous = fraction;
  }
  assert.equal(axis.at(-1), 1450);
  assert.equal(axis.at(2), 2026);
});
test('Dense event axes keep all ticks but thin date labels at phone widths', () => {
  const axis = eventAxis(
    [1450, 2026],
    Array.from({ length: 200 }, (_, n) => 1650 + n / 10),
  );
  for (const width of [199, 269, 566, 1163]) {
    const labels = axis.labels(width);
    assert.equal(labels[0], 1450);
    assert.equal(labels.at(-1), 2026);
    for (let n = 1; n < labels.length; n++)
      assert.ok(
        (axis.position(labels[n]) - axis.position(labels[n - 1])) * width >= 54,
      );
    assert.equal(axis.domain.length, 202);
  }
});
