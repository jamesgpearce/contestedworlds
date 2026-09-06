'use client';
import { type ReactNode } from 'react';
import {
  type Island,
  type Mode,
  data,
  owners,
  powerColor,
} from '@/lib/history';
import {
  periodsFor,
  periodDates,
  type Period,
  type Arrangement,
} from '@/lib/periods';
import { PowerSymbol } from '@/components/power-symbol';
import {
  Table,
  TableCaption,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';

export function PeriodTable({
  tracks,
  mode,
  range,
  arrangement,
  inspectedId,
  eventId,
  year,
  onSelect,
  renderSources,
}: {
  tracks: Island[];
  mode: Mode;
  range: [number, number];
  arrangement: Arrangement;
  inspectedId: string;
  eventId: string;
  year: number;
  onSelect: (period: Period) => void;
  renderSources: (ids: string[]) => ReactNode;
}) {
  const periods = tracks.flatMap((i) => periodsFor(i, mode, range));
  const byPower = arrangement === 'powers';
  const groups = (
    byPower
      ? data.owners.map((o) => ({ id: o.id, label: o.label }))
      : tracks.map((i) => ({ id: i.id, label: i.name }))
  )
    .map((group) => ({
      ...group,
      periods: periods
        .filter((p) => (byPower ? p.power : p.islandId) === group.id)
        .sort(
          (a, b) =>
            a.originalStart - b.originalStart ||
            a.islandId.localeCompare(b.islandId),
        ),
    }))
    .filter((group) => group.periods.length);
  const inspected =
    periods.find(
      (p) => p.islandId === inspectedId && p.event?.id === eventId,
    ) ||
    periods.find(
      (p) => p.islandId === inspectedId && p.start <= year && p.end > year,
    ) ||
    periods.filter((p) => p.islandId === inspectedId).at(-1);

  return (
    <div className="period-table-wrap">
      <Table className="period-table">
        <TableCaption>
          {tracks.length} selected {tracks.length === 1 ? 'island' : 'islands'}{' '}
          · {periods.length} periods of{' '}
          {mode === 'administration' ? 'administration' : 'sovereign title'} ·{' '}
          {range[0]}–{range[1]}. Grouped by {byPower ? 'power' : 'island'}.
          <span>
            Dates run from the original start to the next change or the end of
            this window. Select a period for its history below.
          </span>
        </TableCaption>
        <colgroup>
          <col className="period-identity-column" />
          <col />
          <col className="period-source-column" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">
              Period &amp; {byPower ? 'island' : 'power'}
            </TableHead>
            <TableHead scope="col">How it began</TableHead>
            <TableHead scope="col">Sources</TableHead>
          </TableRow>
        </TableHeader>
        {groups.map((group) => (
          <TableBody key={group.id} data-period-group={group.id}>
            <TableRow className="period-table-group">
              <TableHead colSpan={3} scope="rowgroup">
                <span className="period-table-group-label">
                  {byPower && (
                    <svg viewBox="0 0 22 17" aria-hidden="true">
                      <PowerSymbol id={group.id} />
                    </svg>
                  )}
                  {group.label}
                  <span className="period-table-count">
                    {group.periods.length} periods
                  </span>
                </span>
              </TableHead>
            </TableRow>
            {group.periods.map((p) => {
              const island = tracks.find((i) => i.id === p.islandId)!;
              const selected = p.id === inspected?.id;
              return (
                <TableRow
                  key={p.id}
                  data-table-period-id={p.id}
                  data-state={selected ? 'selected' : undefined}
                >
                  <TableCell>
                    <span className="period-table-date">
                      {periodDates(p, range)}
                    </span>
                    <span className="period-table-owner">
                      <i
                        style={{ background: powerColor(p.power) }}
                        aria-hidden="true"
                      />
                      {byPower ? island.name : owners[p.power].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      className="table-event"
                      aria-pressed={selected}
                      onClick={() => onSelect(p)}
                    >
                      {p.event?.title || 'Opening period'}
                      <span className="sr-only">
                        {' '}
                        · {island.name} · {periodDates(p, range)}
                      </span>
                    </button>
                    <p>{p.event?.detail || island.summary}</p>
                    {p.event?.uncertainty && (
                      <p className="qualification">{p.event.uncertainty}</p>
                    )}
                    {p.event?.qualification && (
                      <p className="qualification">{p.event.qualification}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {renderSources(p.event?.sources || island.sources)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        ))}
      </Table>
    </div>
  );
}
