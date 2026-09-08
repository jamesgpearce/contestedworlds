import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
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
const raw = await read('../src/lib/caribbean.json');
const history = moduleUrl(
  (await read('../src/lib/history.ts')).replace(
    "import raw from './caribbean.json';",
    `const raw=${raw};`,
  ),
);
const periodsModule = moduleUrl(
  (await read('../src/lib/periods.ts')).replace(
    "'./history'",
    JSON.stringify(history),
  ),
);
const {
  periodsFor,
  periodDates,
  packPeriods,
  arrangePeriods,
  plottedEvent,
  startingPeriods,
} = await import(periodsModule);
const { inspectTarget } = await import(
  moduleUrl(
    (await read('../src/lib/chart-inspection.ts'))
      .replaceAll("'./history'", JSON.stringify(history))
      .replace("'./periods'", JSON.stringify(periodsModule)),
  )
);
const { islands, data, stateAt, dateValue } = await import(history);
const { calendarRange, yearPresets } = await import(
  moduleUrl(
    (await read('../src/lib/year-range.ts')).replace(
      "'./history'",
      JSON.stringify(history),
    ),
  )
);

test('Calendar ranges include the final year and its treaty handovers', () => {
  const range = calendarRange([1756, 1763]);
  assert.equal(range[0], 1756);
  assert.ok(range[1] >= dateValue('1763-12-31'));
  assert.ok(range[1] < dateValue('1764-01-01'));
  for (const [id, title] of [
    ['saint-lucia', 'Paris awards Saint Lucia to France'],
    ['tobago', 'Britain takes possession'],
  ]) {
    const island = islands.find((i) => i.id === id);
    const periods = periodsFor(island, 'administration', range);
    assert.ok(periods.some((p) => p.event?.title === title));
  }
});

test('Regional presets and single-year windows preserve continuous history', () => {
  for (const years of [
    ...yearPresets.map((p) => [p.start, p.end]),
    [1763, 1763],
  ]) {
    const range = calendarRange(years);
    assert.ok(range[0] < range[1]);
    for (const island of islands)
      for (const mode of ['administration', 'sovereignty']) {
        const periods = periodsFor(island, mode, range);
        assert.equal(periods[0].start, range[0]);
        assert.equal(periods.at(-1).end, range[1]);
        periods.forEach((p, n) => {
          assert.ok(p.start <= p.end);
          if (n) assert.equal(periods[n - 1].end, p.start);
          if (p.start < p.end)
            assert.equal(p.power, stateAt(island, (p.start + p.end) / 2, mode));
        });
      }
  }
});

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

test('Every hover card resolves only its own island, period, power and cited event', () => {
  const range = [1450, 2026];
  for (const mode of ['administration', 'sovereignty']) {
    const ps = islands.flatMap((i) => periodsFor(i, mode, range));
    for (const p of ps) {
      // A stale event cursor must never override the rectangle under the pointer.
      const inspected = inspectTarget(
        {
          islandId: p.islandId,
          periodId: p.id,
          eventId: 'saint-lucia-12',
          year: 1763,
        },
        islands,
        ps,
        mode,
        range,
      );
      assert.equal(inspected.island.id, p.islandId);
      assert.equal(inspected.period, p);
      assert.equal(inspected.event, p.event);
      assert.equal(inspected.power, p.power);
      assert.ok(inspected.sequence.every((q) => q.islandId === p.islandId));
    }
  }
});

test('Stale or mismatched rectangle targets do not fall back to another island', () => {
  const range = [1450, 2026];
  const ps = islands.flatMap((i) => periodsFor(i, 'administration', range));
  assert.equal(inspectTarget(null, islands, ps, 'administration', range), null);
  assert.equal(
    inspectTarget(
      { islandId: 'missing', year: 1763 },
      islands,
      ps,
      'administration',
      range,
    ),
    null,
  );
  assert.equal(
    inspectTarget(
      {
        islandId: 'saint-lucia',
        periodId: ps.find((p) => p.islandId === 'saba').id,
        year: 1763,
      },
      islands,
      ps,
      'administration',
      range,
    ),
    null,
  );
  assert.equal(
    inspectTarget(
      { islandId: 'saint-lucia', periodId: 'stale', year: 1763 },
      islands,
      ps,
      'administration',
      range,
    ),
    null,
  );
});

test('Claim and contextual records keep their exact text, dates and evidence in either mode', () => {
  const range = [1450, 2026];
  for (const mode of ['administration', 'sovereignty']) {
    const ps = islands.flatMap((i) => periodsFor(i, mode, range));
    for (const island of islands)
      for (const e of island.events) {
        const inspected = inspectTarget(
          { islandId: island.id, eventId: e.id, year: dateValue(e.date) },
          islands,
          ps,
          mode,
          range,
        );
        assert.equal(inspected.event, e);
        assert.equal(inspected.island, island);
        assert.equal(
          inspected.standalone,
          plottedEvent(e, mode) ? undefined : e,
        );
        if (e.kind === 'claim')
          assert.equal(inspected.power, e.claimant || inspected.period.power);
      }
  }
});

test('Starting labels identify every island under its actual power at the visible boundary', () => {
  for (const mode of ['administration', 'sovereignty']) {
    for (const range of [
      [1450, 2026],
      [1763, 1820],
      [1800, 2026],
    ]) {
      const ps = islands.flatMap((i) => periodsFor(i, mode, range));
      const starts = startingPeriods(ps);
      assert.equal(starts.length, islands.length);
      assert.equal(new Set(starts.map((p) => p.islandId)).size, islands.length);
      for (const p of starts) {
        const island = islands.find((i) => i.id === p.islandId);
        assert.equal(p.start, range[0]);
        assert.equal(p.power, stateAt(island, range[0], mode));
      }
    }
  }
});

// Cropping the chart must not rewrite the historical dates in its cards.
test('Clipped cards retain full period dates and the original Indigenous baseline', () => {
  for (const island of islands)
    for (const mode of ['administration', 'sovereignty']) {
      const full = periodsFor(island, mode, [1450, 2026]);
      for (const range of [
        [1500, 1700],
        [1763, 1800],
        [1950, 2000],
      ]) {
        for (const clipped of periodsFor(island, mode, range)) {
          const original = full.find((p) => p.id === clipped.id);
          assert.equal(periodDates(clipped), periodDates(original), island.id);
          assert.equal(clipped.endEvent?.id, original.endEvent?.id, island.id);
        }
      }
    }
});
