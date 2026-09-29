// A place and its region (docs/14): a region is its own region.
type Place = { readonly parentId: string | null };
type Places = ReadonlyMap<string, Place>;

export const regionOf = (id: string, places: Places) => places.get(id)?.parentId ?? id;

// The channels of a trip (docs/15): the channel of the region it leaves and of the region it goes
// to, once each. A region without a channel (Toshkent shahri) gives none.
export function channelsOf(
  from: string,
  to: string,
  places: Places,
  channels: Readonly<Record<string, string>>,
): string[] {
  const regions = new Set([regionOf(from, places), regionOf(to, places)]);
  return [...regions].map((region) => channels[region]).filter((channel) => channel !== undefined);
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
