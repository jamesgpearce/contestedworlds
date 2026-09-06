import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const moduleUrl = (text) =>
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(text, {
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
    `const raw=${raw};`,
  ),
);
const { periodsFor, packPeriods, arrangePeriods, plottedEvent } = await import(
  moduleUrl(
    (await read('../lib/periods.ts')).replace(
      "'./history'",
      JSON.stringify(history),
    ),
  )
);
const { islands, data, stateAt } = await import(history);

test('Every island and mode retains full period coverage and the recorded power at each date', () => {
  for (const i of islands)
    for (const mode of ['administration', 'sovereignty'])
      for (const range of [
        [1450, 2026],
        [1600, 1820],
        [1790, 2026],
      ]) {
        const ps = periodsFor(i, mode, range);
        assert.equal(ps[0].start, range[0]);
        assert.equal(ps.at(-1).end, range[1]);
        assert.equal(new Set(ps.map((p) => p.id)).size, ps.length);
        ps.forEach((p, n) => {
          assert.ok(p.start <= p.end);
          if (n) assert.equal(ps[n - 1].end, p.start);
          if (p.start < p.end)
            assert.equal(p.power, stateAt(i, (p.start + p.end) / 2, mode));
        });
      }
});
test('Clipping changes the visible extent without replacing period identities', () => {
  for (const i of islands) {
    const all = periodsFor(i, 'administration', [1450, 2026]);
    for (const p of periodsFor(i, 'administration', [1600, 1820]))
      assert.ok(all.some((q) => q.id === p.id && q.power === p.power));
  }
});
test('Powers pack concurrent periods without hiding or overlapping them', () => {
  for (const mode of ['administration', 'sovereignty']) {
    const ps = islands.flatMap((i) => periodsFor(i, mode, [1450, 2026]));
    const packed = packPeriods(ps);
    for (let n = 0; n < ps.length; n++)
      for (let m = n + 1; m < ps.length; m++) {
        const a = ps[n],
          b = ps[m];
        if (
          a.power === b.power &&
          packed.lanes.get(a.id) === packed.lanes.get(b.id)
        )
          assert.ok(a.end <= b.start || b.end <= a.start);
      }
    assert.deepEqual(
      [...packPeriods([...ps].reverse()).lanes].sort(),
      [...packed.lanes].sort(),
    );
  }
});
test('Both arrangements retain every rectangle and fit their rows on phones and desktop', () => {
  for (const width of [288, 390, 768, 1440])
    for (const selected of [
      islands.slice(0, 1),
      islands.slice(0, 4),
      islands,
    ]) {
      const ps = selected.flatMap((i) =>
        periodsFor(i, 'administration', [1450, 2026]),
      );
      for (const view of ['islands', 'powers']) {
        const l = arrangePeriods(
          ps,
          selected.map((i) => i.id),
          data.owners.map((o) => o.id),
          width,
          view,
        );
        assert.equal(Object.keys(l.positions).length, ps.length);
        for (const p of ps) {
          const pos = l.positions[p.id];
          const row = l.rows.find(
            (r) => r.id === (view === 'islands' ? p.islandId : p.power),
          );
          assert.ok(pos.y >= row.top && pos.y + pos.height <= row.bottom);
        }
      }
    }
});
test('The event domain excludes contextual records and includes claims only on request', () => {
  const stVincent = islands.find((i) => i.id === 'saint-vincent');
  const claim = stVincent.events.find((e) => e.kind === 'claim');
  const context = stVincent.events.find(
    (e) => !e.changesControl && !e.changesSovereignty && e.kind !== 'claim',
  );
  assert.equal(plottedEvent(claim, 'administration'), false);
  assert.equal(plottedEvent(claim, 'administration', true), true);
  assert.equal(plottedEvent(context, 'administration', true), false);
});
