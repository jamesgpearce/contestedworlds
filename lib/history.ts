import raw from './caribbean.json';
export type HistoryEvent = {
  id: string;
  date: string;
  year: number;
  precision: string;
  kind: string;
  title: string;
  detail: string;
  controller: string | null;
  sovereign: string | null;
  sources: string[];
  uncertainty?: string;
  qualification?: string;
  claimant?: string;
  changesControl: boolean;
  changesSovereignty: boolean;
  previousController: string;
  previousSovereign: string;
  resultingController: string;
  resultingSovereign: string;
};
export type Island = {
  id: string;
  name: string;
  place: string;
  region: string;
  coordinates: number[];
  peoples: string;
  summary: string;
  notes: string;
  sources: string[];
  initialController: string;
  initialSovereign: string;
  events: HistoryEvent[];
  controlChanges: number;
  currentController: string;
  currentSovereign: string;
};
export type Mode = 'administration' | 'sovereignty';
export const data = raw as unknown as Omit<typeof raw, 'islands'> & {
  islands: Island[];
};
export const owners = Object.fromEntries(data.owners.map((o) => [o.id, o]));
export function powerColor(id: string) {
  const color = owners[id]?.color || '#7b897a';
  return `light-dark(${color}, color-mix(in srgb, ${color} 70%, white))`;
}
export const sources = Object.fromEntries(data.sources.map((s) => [s.id, s]));
export const islands = data.islands;
export const START = data.meta.startYear,
  END = data.meta.endYear;
export function dateValue(date: string) {
  const [y, m = 1, d = 1] = date.split('-').map(Number);
  const start = Date.UTC(y, 0, 1),
    end = Date.UTC(y + 1, 0, 1);
  return y + (Date.UTC(y, m - 1, d) - start) / (end - start);
}
export function eventDate(e: HistoryEvent) {
  if (e.precision === 'circa') return `c. ${e.year}`;
  if (e.precision === 'year') return `${e.year}`;
  return new Date(
    `${e.date}${e.precision === 'month' ? '-01' : ''}T12:00:00Z`,
  ).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    ...(e.precision === 'day' ? { day: 'numeric' as const } : {}),
    timeZone: 'UTC',
  });
}
export function stateAt(i: Island, year: number, mode: Mode) {
  let owner =
    mode === 'administration' ? i.initialController : i.initialSovereign;
  for (const e of i.events) {
    if (dateValue(e.date) > year) break;
    owner = (mode === 'administration' ? e.controller : e.sovereign) || owner;
  }
  return owner;
}
export function changes(i: Island, mode: Mode) {
  return i.events.filter((e) =>
    mode === 'administration' ? e.changesControl : e.changesSovereignty,
  );
}
export function color(i: Island) {
  const value =
    i.id === 'saint-lucia'
      ? '#285ce5'
      : palette[islands.indexOf(i) % palette.length];
  return `light-dark(${value}, color-mix(in srgb, ${value} 70%, white))`;
}
const palette = [
  '#007b76',
  '#a17200',
  '#137eab',
  '#9953a4',
  '#c0521b',
  '#3265a2',
  '#965c46',
  '#098880',
  '#bd4169',
  '#667735',
  '#9d782b',
  '#4275a2',
];
export function historyPath(
  i: Island,
  mode: Mode,
  range: [number, number],
  x: (n: number) => number,
  y: (s: string) => number,
  cornerRadius = 0,
) {
  let owner = stateAt(i, range[0], mode);
  let p = `M${x(range[0])},${y(owner)}`;
  const transitions = changes(i, mode).filter((e) => {
    const t = dateValue(e.date);
    return t > range[0] && t <= range[1];
  });
  for (const [index, e] of transitions.entries()) {
    const xx = x(dateValue(e.date));
    const previousY = y(owner);
    owner =
      mode === 'administration' ? e.resultingController : e.resultingSovereign;
    const nextY = y(owner);
    const previousX = index
      ? x(dateValue(transitions[index - 1].date))
      : x(range[0]);
    const nextX =
      index + 1 < transitions.length
        ? x(dateValue(transitions[index + 1].date))
        : x(range[1]);
    // Only soften the elbows. The vertical transition stays on the exact date.
    // Half-interval caps prevent adjacent bends from overlapping or reversing time.
    const radius = Math.max(
      0,
      Math.min(
        cornerRadius,
        (xx - previousX) / 2,
        (nextX - xx) / 2,
        Math.abs(nextY - previousY) / 2,
      ),
    );
    if (radius) {
      const direction = Math.sign(nextY - previousY);
      p += `H${xx - radius}Q${xx},${previousY} ${xx},${previousY + direction * radius}`;
      p += `V${nextY - direction * radius}Q${xx},${nextY} ${xx + radius},${nextY}`;
    } else {
      p += `H${xx}V${nextY}`;
    }
  }
  return p + `H${x(range[1])}`;
}

export function powersInRange(i: Island, mode: Mode, range: [number, number]) {
  return new Set([
    stateAt(i, range[0], mode),
    ...changes(i, mode)
      .filter(
        (e) => dateValue(e.date) > range[0] && dateValue(e.date) <= range[1],
      )
      .map((e) =>
        mode === 'administration'
          ? e.resultingController
          : e.resultingSovereign,
      ),
  ]);
}
export function chartPowerRows(
  i: Island,
  mode: Mode,
  range: [number, number],
  collapse: boolean,
) {
  const relevant = powersInRange(i, mode, range);
  if (!collapse || relevant.size === data.owners.length) return data.owners;
  const kept = data.owners.filter((o) => relevant.has(o.id));
  const other = {
    id: 'other',
    label: 'Other powers',
    color: '#8394ae',
    description: `${data.owners
      .filter((o) => !relevant.has(o.id))
      .map((o) => o.label)
      .join(
        ', ',
      )}. Grouped only in this chart; the underlying histories remain distinct.`,
  };
  return [
    ...kept.filter((o) => o.id !== 'independent'),
    other,
    ...kept.filter((o) => o.id === 'independent'),
  ];
}

export function changeCount(i: Island, mode: Mode, range: [number, number]) {
  return changes(i, mode).filter(
    (e) => dateValue(e.date) >= range[0] && dateValue(e.date) <= range[1],
  ).length;
}
export function changeWidth(count: number) {
  return 0.9 + 0.45 * Math.sqrt(Math.max(0, count));
}
