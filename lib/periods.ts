import {
  dateValue,
  eventDate,
  type HistoryEvent,
  type Island,
  type Mode,
} from './history';

/** A period has a stable identity in both arrangements. Clipping never changes its key. */
export type Period = {
  id: string;
  islandId: string;
  power: string;
  start: number;
  end: number;
  originalStart: number;
  event: HistoryEvent | null;
  endEvent: HistoryEvent | null;
};
export function periodDates(p: Period, range: [number, number]) {
  const start = p.event ? eventDate(p.event) : `Before ${range[0]}`;
  return `${start} – ${p.endEvent ? eventDate(p.endEvent) : Math.floor(p.end)}`;
}

export function plottedEvent(e: HistoryEvent, mode: Mode, claims = false) {
  return (
    (mode === 'administration' ? e.changesControl : e.changesSovereignty) ||
    (claims && e.kind === 'claim')
  );
}
export function periodsFor(
  island: Island,
  mode: Mode,
  range: [number, number],
): Period[] {
  let power =
    mode === 'administration'
      ? island.initialController
      : island.initialSovereign;
  let start = -Infinity;
  let event: HistoryEvent | null = null;
  const result: Period[] = [];
  const append = (end: number, endEvent: HistoryEvent | null = null) => {
    // Retain zero-duration changes as marks, without inventing a duration.
    if (
      end >= range[0] &&
      start <= range[1] &&
      !(end === range[0] && start < end)
    )
      result.push({
        id: `${island.id}:${event?.id || 'initial'}`,
        islandId: island.id,
        power,
        start: Math.max(start, range[0]),
        end: Math.min(end, range[1]),
        originalStart: start,
        event,
        endEvent,
      });
  };
  for (const e of island.events.filter((e) => plottedEvent(e, mode))) {
    const t = dateValue(e.date);
    if (t > range[1]) break;
    append(t, e);
    start = t;
    power =
      mode === 'administration' ? e.resultingController : e.resultingSovereign;
    event = e;
  }
  append(range[1]);
  return result;
}

/** One starting track per island, preferring a lasting period at the window boundary. */
export function startingPeriods(periods: Period[]) {
  const first = new Map<string, Period>();
  for (const p of periods) {
    const previous = first.get(p.islandId);
    if (
      !previous ||
      (p.start === previous.start && previous.start === previous.end)
    )
      first.set(p.islandId, p);
  }
  return [...first.values()];
}

/** Interval packing within each power, with a preference for an island's previous lane. */
export function packPeriods(periods: Period[]) {
  const lanes = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const power of new Set(periods.map((p) => p.power))) {
    const ends: number[] = [];
    const preferred = new Map<string, number>();
    const sorted = periods
      .filter((p) => p.power === power)
      .sort(
        (a, b) =>
          a.start - b.start ||
          a.islandId.localeCompare(b.islandId) ||
          a.id.localeCompare(b.id),
      );
    for (const p of sorted) {
      const previous = preferred.get(p.islandId);
      let lane =
        previous !== undefined && ends[previous] <= p.start
          ? previous
          : ends.findIndex((end) => end <= p.start);
      if (lane < 0) lane = ends.length;
      ends[lane] = p.end;
      lanes.set(p.id, lane);
      preferred.set(p.islandId, lane);
    }
    counts.set(power, ends.length);
  }
  return { lanes, counts };
}

export type Arrangement = 'islands' | 'powers';
export type Placement = { y: number; height: number };
export type PeriodRow = {
  id: string;
  top: number;
  bottom: number;
  labelY: number;
  lanes: number;
};
export function arrangePeriods(
  periods: Period[],
  islandIds: string[],
  powerIds: string[],
  width: number,
  arrangement: Arrangement,
) {
  const compact = width < 700;
  const packed = packPeriods(periods);
  const labelStarts = arrangement === 'powers' && islandIds.length > 1;
  const startingPowers = new Set(
    labelStarts ? startingPeriods(periods).map((p) => p.power) : [],
  );
  const headingAbove = (id: string) => compact || startingPowers.has(id);
  const ids =
    arrangement === 'islands'
      ? islandIds
      : powerIds.filter((id) => packed.counts.has(id));
  const heights = ids.map((id) =>
    arrangement === 'islands'
      ? compact
        ? 68
        : 62
      : Math.max(
          compact ? 58 : 44,
          (packed.counts.get(id) || 1) * 12 +
            (compact ? 38 : startingPowers.has(id) ? 44 : 20),
        ),
  );
  const extra =
    Math.max(0, (compact ? 306 : 350) - heights.reduce((a, b) => a + b, 0)) /
    Math.max(1, ids.length);
  let top = 34;
  const rows: PeriodRow[] = ids.map((id, n) => {
    const height = heights[n] + extra;
    const row = {
      id,
      top,
      bottom: top + height,
      labelY: headingAbove(id) ? top + 15 : top + height / 2,
      lanes: arrangement === 'islands' ? 1 : packed.counts.get(id)!,
    };
    top += height;
    return row;
  });
  const positions: Record<string, Placement> = {};
  for (const p of periods) {
    const row = rows.find(
      (r) => r.id === (arrangement === 'islands' ? p.islandId : p.power),
    )!;
    const height = arrangement === 'islands' ? 16 : 8;
    const lane = arrangement === 'islands' ? 0 : packed.lanes.get(p.id)!;
    const center = (row.top + (headingAbove(row.id) ? 24 : 0) + row.bottom) / 2;
    positions[p.id] = {
      y: center + (lane - (row.lanes - 1) / 2) * 12 - height / 2,
      height,
    };
  }
  return {
    positions,
    rows,
    height: top + 8,
    compact,
    left: compact ? (labelStarts ? 126 : 8) : width < 1000 ? 210 : 240,
    starting: labelStarts ? startingPeriods(periods) : [],
    right: 12,
  };
}
