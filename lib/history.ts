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
const dateFormatters = {
  month: new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }),
  day: new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }),
};
export function eventDate(e: HistoryEvent) {
  if (e.precision === 'circa') return `c. ${e.year}`;
  if (e.precision === 'year') return `${e.year}`;
  return dateFormatters[e.precision === 'month' ? 'month' : 'day'].format(
    new Date(`${e.date}${e.precision === 'month' ? '-01' : ''}T12:00:00Z`),
  );
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
export function changeCount(i: Island, mode: Mode, range: [number, number]) {
  return changes(i, mode).filter(
    (e) => dateValue(e.date) >= range[0] && dateValue(e.date) <= range[1],
  ).length;
}
