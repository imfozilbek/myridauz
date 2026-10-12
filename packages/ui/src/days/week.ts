import { COUNTED_DAYS, DAY_MS, tashkentDate } from '@platform/contracts';

// The row of the week everywhere (owner decision 12.10.2026, docs/172): today and the six days after
// it; a day with trips or requests has its dot.
export type WeekDay = { readonly date: string; readonly marked: boolean };

export const weekOf = (now: number) =>
  Array.from({ length: COUNTED_DAYS }, (_, day) => tashkentDate(now + day * DAY_MS));

// The days of a count from the server (the trips of «Safarlar», the requests of the board).
export const countedWeek = (days: readonly { readonly date: string; readonly count: number }[]) =>
  days.map((day): WeekDay => ({ date: day.date, marked: day.count > 0 }));
