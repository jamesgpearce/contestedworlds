import { eventDate, type Island, type HistoryEvent } from './history';
import { periodDates, plottedEvent, type Period } from './periods';
import type { Mode } from './history';

export type InspectionTarget = {
  islandId: string;
  periodId?: string;
  eventId?: string;
  year: number;
};

/** Resolve every part of a card from one island and one explicit target. */
export function inspectTarget(
  target: InspectionTarget | null,
  tracks: Island[],
  periods: Period[],
  mode: Mode,
  range: [number, number],
) {
  if (!target || target.year < range[0] || target.year > range[1]) return null;
  const island = tracks.find((i) => i.id === target.islandId);
  if (!island) return null;
  const sequence = periods.filter((p) => p.islandId === island.id);
  const period = target.periodId
    ? sequence.find((p) => p.id === target.periodId)
    : sequence.find((p) => target.eventId && p.event?.id === target.eventId) ||
      sequence.find((p) => p.start <= target.year && p.end > target.year) ||
      sequence.find((p) => p.start === target.year) ||
      (sequence.at(-1)?.end === target.year ? sequence.at(-1) : undefined);
  if (!period) return null;
  const record =
    !target.periodId && target.eventId
      ? island.events.find((e) => e.id === target.eventId)
      : undefined;
  const standalone = record && !plottedEvent(record, mode) ? record : undefined;
  const event: HistoryEvent | null = standalone || period.event;
  return {
    island,
    period,
    event,
    standalone,
    power:
      event?.kind === 'claim' ? event.claimant || period.power : period.power,
    dates: standalone ? eventDate(standalone) : periodDates(period),
    sequence,
    index: sequence.indexOf(period),
  };
}

export type Inspection = NonNullable<ReturnType<typeof inspectTarget>>;
