import { channelOf, type BrandConfig } from '@platform/brands';
import type { PlaceDirectory } from '../places/directory';

// Why a channel is «Siz uchun» (docs/119): a passenger goes there often, has a request there or
// searched it last; a driver drives there often, many requests wait there, or the last trip went there.
export type Reason = 'often' | 'request' | 'search' | 'drives' | 'requests' | 'lastTrip';
export type Route = { readonly from: string; readonly to: string };
type ForYou = { readonly username: string; readonly reason: Reason };

// At most three, each channel once (mockups 7-channels-2 and 7-channels-3).
const SHOWN = 3;
// «Koʻp» is two trips at least: one trip is not a habit.
const OFTEN = 2;

// The channel of the other end of a route: the end that is not Tashkent (docs/15). A whole region
// stands for its places.
export const routeChannel = (brand: BrandConfig, directory: PlaceDirectory) => (route: Route) => {
  const places = (id: string) => [id, ...directory.inside(id).map((place) => place.id)];
  return channelOf(brand, ...places(route.to), ...places(route.from))?.username ?? null;
};

// The channel most of these routes go to, when it is a habit.
export function mostOf(routes: readonly Route[], channel: (route: Route) => string | null) {
  const counts = new Map<string, number>();
  for (const route of routes) {
    const username = channel(route);
    if (username) counts.set(username, (counts.get(username) ?? 0) + 1);
  }
  const [best] = [...counts].sort((a, b) => b[1] - a[1]);
  return best && best[1] >= OFTEN ? best[0] : null;
}

// The first reason of a channel wins; a channel that is not there yet (OPS-02) is never offered.
export function forYou(candidates: readonly (readonly [string | null, Reason])[], made: ReadonlySet<string>) {
  const picked: ForYou[] = [];
  for (const [username, reason] of candidates) {
    if (!username || !made.has(username) || picked.some((item) => item.username === username)) continue;
    picked.push({ username, reason });
  }
  return picked.slice(0, SHOWN);
}
