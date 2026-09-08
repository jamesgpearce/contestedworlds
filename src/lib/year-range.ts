import { data, dateValue, START, END } from './history';

export const yearPresets = [
  { id: 'all', title: 'The whole story', start: START, end: END },
  ...data.contexts,
];

/** Include records throughout the final calendar year, including 31 December. */
export function calendarRange([start, end]: [number, number]): [
  number,
  number,
] {
  return [start, dateValue(`${end}-12-31`)];
}
