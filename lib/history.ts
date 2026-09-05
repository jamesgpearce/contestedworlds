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
  return i.id === 'saint-lucia'
    ? '#a14a40'
    : palette[islands.indexOf(i) % palette.length];
}
const palette = [
  '#69846b',
  '#a38540',
  '#558194',
  '#8d6d85',
  '#a66646',
  '#6d839b',
  '#98795a',
  '#688e88',
  '#aa6965',
  '#7b8070',
  '#a08b60',
  '#678ca1',
];
export function historyPath(
  i: Island,
  mode: Mode,
  range: [number, number],
  x: (n: number) => number,
  y: (s: string) => number,
) {
  let owner = stateAt(i, range[0], mode);
  let p = `M${x(range[0])},${y(owner)}`;
  for (const e of changes(i, mode)) {
    const t = dateValue(e.date);
    if (t <= range[0] || t > range[1]) continue;
    owner =
      mode === 'administration' ? e.resultingController : e.resultingSovereign;
    p += `H${x(t)}V${y(owner)}`;
  }
  return p + `H${x(range[1])}`;
}
