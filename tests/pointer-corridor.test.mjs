import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(
  new URL('../lib/pointer-corridor.ts', import.meta.url),
  'utf8',
);
const { withinCardCorridor } = await import(
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  ).toString('base64')}`
);

test('A pointer can cross neighbouring tracks on its way into left- or right-aligned details', () => {
  for (const [origin, card] of [
    [
      { x: 800, y: 100 },
      { left: 200, right: 590, top: 112, bottom: 480 },
    ],
    [
      { x: 250, y: 100 },
      { left: 500, right: 890, top: 112, bottom: 480 },
    ],
    [
      { x: 160, y: 100 },
      { left: 12, right: 308, top: 110, bottom: 600 },
    ],
  ]) {
    for (const x of [
      card.left + 1,
      (card.left + card.right) / 2,
      card.right - 1,
    ]) {
      for (let t = 0; t <= 1; t += 0.025) {
        assert.ok(
          withinCardCorridor(
            {
              x: origin.x + (x - origin.x) * t,
              y: origin.y + (card.top + 1 - origin.y) * t,
            },
            origin,
            card,
          ),
        );
      }
      assert.ok(withinCardCorridor({ x, y: card.bottom - 1 }, origin, card));
    }
  }
});

test('Moving back to the chart or away from the card releases the hover target', () => {
  const origin = { x: 800, y: 100 };
  const card = { left: 200, right: 590, top: 112, bottom: 480 };
  for (const point of [
    { x: 820, y: 100 },
    { x: 800, y: 90 },
    { x: 800, y: 130 },
    { x: 300, y: 490 },
  ])
    assert.equal(withinCardCorridor(point, origin, card), false);
});
