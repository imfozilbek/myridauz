import { PAINS, type Pain, type WaitlistRole } from '@platform/contracts';

const PERCENT = 100;
const SHORTAGE_ROWS = 3;

// The rows the team screens are made of (docs/181, docs/183).
export type RoleRow = { readonly region: string; readonly role: WaitlistRole; readonly count: number };
export type PainCounts = Readonly<Record<'total' | Pain, number>>;
export type ReachRow = { readonly key: string | null; readonly opened: number; readonly listed: number };
export type DirectionRow = { readonly region: string; readonly passengers: number; readonly drivers: number };

// The directions of the list by region, the most waiting people first (docs/181).
export function directionsOf(rows: readonly RoleRow[]): DirectionRow[] {
  const byRegion = new Map<string, DirectionRow>();
  for (const { region, role, count } of rows) {
    const row = byRegion.get(region) ?? { region, passengers: 0, drivers: 0 };
    byRegion.set(
      region,
      role === 'driver'
        ? { ...row, drivers: row.drivers + count }
        : { ...row, passengers: row.passengers + count },
    );
  }
  return [...byRegion.values()].sort((a, b) => b.passengers + b.drivers - (a.passengers + a.drivers));
}

// «Eng koʻp ogʻriq»: the pain the most people chose and its share; none while nobody waits.
export function topPainOf(counts: PainCounts): { pain: Pain; share: number } | null {
  if (counts.total === 0) return null;
  const pain = PAINS.reduce((best, next) => (counts[next] > counts[best] ? next : best));
  return { pain, share: Math.round((counts[pain] / counts.total) * PERCENT) };
}

// The share of a pain among the people of a side: the bars of the screen of a direction.
export const shareOf = (count: number, total: number) =>
  total === 0 ? 0 : Math.round((count / total) * PERCENT);

// «Haydovchi yetishmaydi»: where the most passengers wait for one driver (docs/183).
export function shortageOf(rows: readonly DirectionRow[]): DirectionRow[] {
  const perDriver = (row: DirectionRow) => row.passengers / Math.max(row.drivers, 1);
  return rows
    .filter((row) => row.passengers > 0)
    .sort((a, b) => perDriver(b) - perDriver(a))
    .slice(0, SHORTAGE_ROWS);
}

// Rows of the first touches summed by a key of their own: the source of a mark, the platform.
export function reachBy<K extends string>(
  rows: readonly ReachRow[],
  keyOf: (key: string | null) => K,
): { key: K; opened: number; listed: number }[] {
  const sums = new Map<K, { key: K; opened: number; listed: number }>();
  for (const row of rows) {
    const key = keyOf(row.key);
    const sum = sums.get(key) ?? { key, opened: 0, listed: 0 };
    sums.set(key, { key, opened: sum.opened + row.opened, listed: sum.listed + row.listed });
  }
  return [...sums.values()].sort((a, b) => b.opened - a.opened);
}
