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

// What a post says about a trip now: seats to book, no seats, the trip left, or no trip (docs/15).
export type PostState = 'open' | 'full' | 'started' | 'cancelled';
type Status = 'active' | 'full' | 'completed' | 'cancelled';
type PostedTrip = { readonly status: Status; readonly seatsLeft: number; readonly departAt: number };
// What a post shows, in short: when it differs from the trip now, the post is edited.
export const shownOf = (trip: { status: Status; seatsLeft: number; woman: boolean }) =>
  `${trip.status} ${trip.seatsLeft} ${trip.woman}`;

export const postState = (trip: PostedTrip, now: number): PostState => {
  if (trip.status === 'cancelled') return 'cancelled';
  if (trip.status === 'completed' || trip.departAt <= now) return 'started';
  return trip.status === 'full' || trip.seatsLeft <= 0 ? 'full' : 'open';
};
