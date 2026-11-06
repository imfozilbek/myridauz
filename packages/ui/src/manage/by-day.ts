import { tashkentDate } from '@platform/contracts';

// The items of one Tashkent day together, the newest day first, as they came («Jurnal», G95
// «Mening qarorlarim»).
export function byDay<T extends { readonly at: number }>(items: readonly T[]): [string, T[]][] {
  const days = new Map<string, T[]>();
  for (const item of items) {
    const date = tashkentDate(item.at);
    days.set(date, [...(days.get(date) ?? []), item]);
  }
  return [...days];
}
