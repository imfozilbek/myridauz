import { onTheWay } from '@platform/contracts';

// A place and its region (docs/14): a region is its own region.
type Place = { readonly parentId: string | null };
type Places = ReadonlyMap<string, Place>;

export const regionOf = (id: string, places: Places) => places.get(id)?.parentId ?? id;

// A channel and the places it covers: a region, districts or both (docs/63).
export type ChannelCoverage = { readonly username: string; readonly places: readonly string[] };

// A place and every place above it: a district, then its region.
function lineOf(id: string, places: Places): string[] {
  const line: string[] = [];
  for (let at: string | null = id; at !== null && !line.includes(at); at = places.get(at)?.parentId ?? null)
    line.push(at);
  return line;
}

// The channel covers the place or a place above it (docs/63).
export const covers = (channel: ChannelCoverage, id: string, places: Places) =>
  lineOf(id, places).some((at) => channel.places.includes(at));

// The channels of a trip (docs/15, docs/63): every channel whose list has the place the trip leaves
// or goes to, or a place above it. One post can go to several channels; each channel gets it once.
// Toshkent shahri has no channel, so a trip there reaches only the channels of the other end.
export function channelsOf(
  from: string,
  to: string,
  places: Places,
  channels: readonly ChannelCoverage[],
): string[] {
  const reached = new Set([...lineOf(from, places), ...lineOf(to, places)]);
  return channels
    .filter((channel) => channel.places.some((place) => reached.has(place)))
    .map((c) => c.username);
}

// What a post says about a trip now (docs/15, G68 «Post hayoti»): seats to book, the last seat, no
// seats, on the road, arrived, or cancelled.
export type PostState = 'open' | 'lastSeat' | 'full' | 'started' | 'arrived' | 'cancelled';
type Status = 'active' | 'full' | 'completed' | 'cancelled';
type PostedTrip = {
  readonly status: Status;
  readonly seatsLeft: number;
  readonly departAt: number;
  readonly departedAt: number | null;
  readonly arrivedAt: number | null;
};
// What a post shows, in short: when it differs from the trip now, the post is edited.
export const shownOf = (trip: { status: Status; seatsLeft: number; woman: boolean }) =>
  `${trip.status} ${trip.seatsLeft} ${trip.woman}`;

// A trip on the road by the clock or by «Yoʻlga chiqdim» of the driver has started (G63); «Yetib
// keldik» or the end of its time: arrived.
export const postState = (trip: PostedTrip, now: number): PostState => {
  if (trip.status === 'cancelled') return 'cancelled';
  if (trip.status === 'completed' || trip.arrivedAt !== null) return 'arrived';
  if (onTheWay(trip, now)) return 'started';
  if (trip.status === 'full' || trip.seatsLeft <= 0) return 'full';
  return trip.seatsLeft === 1 ? 'lastSeat' : 'open';
};
