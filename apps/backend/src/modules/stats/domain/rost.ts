import { GROWTH_LOOPS, loopOf, type GrowthLoop, type Rost } from '@platform/contracts';
import type { ArrivalCount } from './arrivals';

// The sessions or the people of one mark; the searches of one direction with their result.
export type MarkCount = { readonly via: string; readonly count: number };
export type SearchCount = { readonly route: string; readonly result: string; readonly count: number };
type Counted = { readonly via: string | null; readonly count: number };

// The counts of the marks of one kind summed by their loop; the marks of channels and ads have none.
function byLoop(rows: readonly Counted[]): Map<GrowthLoop, number> {
  const sums = new Map<GrowthLoop, number>();
  for (const { via, count } of rows) {
    const loop = via ? loopOf(via)?.loop : undefined;
    if (loop) sums.set(loop, (sums.get(loop) ?? 0) + count);
  }
  return sums;
}

// Every loop of growth with what came of it (docs/123): came, registered, rode.
export function loopsOf(
  came: readonly MarkCount[],
  arrivals: readonly ArrivalCount[],
  rode: readonly MarkCount[],
): Rost['loops'] {
  const [sessions, registered, riders] = [byLoop(came), byLoop(arrivals), byLoop(rode)];
  return GROWTH_LOOPS.map((loop) => ({
    loop,
    came: sessions.get(loop) ?? 0,
    registered: registered.get(loop) ?? 0,
    rode: riders.get(loop) ?? 0,
  }));
}

// The searches of each direction and how many found a trip, the most searched first.
const ROUTE = /^\d{4}-\d{4}$/u;
const FOUND = 'found';
export function directionsOf(rows: readonly SearchCount[]): Rost['directions'] {
  const routes = new Map<string, { searches: number; found: number }>();
  for (const { route, result, count } of rows) {
    if (!ROUTE.test(route)) continue;
    const known = routes.get(route) ?? { searches: 0, found: 0 };
    routes.set(route, {
      searches: known.searches + count,
      found: known.found + (result === FOUND ? count : 0),
    });
  }
  return [...routes].map(([route, sums]) => ({ route, ...sums })).sort((a, b) => b.searches - a.searches);
}
