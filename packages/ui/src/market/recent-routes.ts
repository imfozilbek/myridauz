import { asRecord } from '../flow/flow-draft';
import type { Route } from '../places/route-screen';
import { readStored, writeStored } from '../telegram/device-storage';

// The last routes of a search (G35, docs/97 K5): on the main screen, one tap to their trips. Only the
// ids are kept; the names come from the directory. A convenience: an empty list is fine.
const KEY = 'route_recent';
const MAX = 3;
export type RecentRoute = { readonly from: string; readonly to: string };
const isRoute = (value: unknown): value is RecentRoute =>
  typeof asRecord(value)?.['from'] === 'string' && typeof asRecord(value)?.['to'] === 'string';

export function recentRoutes(): RecentRoute[] {
  try {
    const parsed: unknown = JSON.parse(readStored(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isRoute).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function rememberRoute(route: Route) {
  const next = { from: route.from.id, to: route.to.id };
  const others = recentRoutes().filter((old) => old.from !== next.from || old.to !== next.to);
  writeStored(KEY, JSON.stringify([next, ...others].slice(0, MAX)));
}
