import type { TripPublicity } from '@platform/contracts';
import { channelsOf } from '../domain/route-channels';
import type { ChannelPostStore } from './ports';

// What the publicity needs of a trip: its driver, its ends, and whether it still takes people.
export type TripFacts = {
  readonly driverId: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // Active or full and not over yet (docs/35).
  readonly live: boolean;
};

// The different people who opened a trip in the app: one row per person and trip (G63, docs/119).
export type TripViewStore = {
  record(tripId: string, userId: number, at: number): Promise<void>;
  count(tripId: string): Promise<number>;
  // A deleted account (docs/30).
  forget(userId: number): Promise<void>;
};

type Place = { readonly parentId: string | null };
type Channel = { readonly username: string; readonly title: string; readonly places: readonly string[] };

export type PublicityDeps = {
  // The channel posts are on only when the owner switched them on (docs/33).
  readonly enabled: boolean;
  readonly trip: (id: string) => Promise<TripFacts | undefined>;
  readonly places: () => Promise<ReadonlyMap<string, Place>>;
  // The zones of the brand and the channels of the team, with their titles (docs/63).
  readonly channels: () => Promise<readonly Channel[]>;
  readonly posts: Pick<ChannelPostStore, 'byTrip'>;
  readonly views: TripViewStore;
  // The link the driver sends to people: it carries its own mark (docs/116).
  readonly link: (tripId: string) => string;
  readonly now: () => number;
};

// «Safaringiz kanalda chiqdi», «N kishi koʻrdi» and «Havolani yoʻlovchilarga yuborish» (G63, docs/119):
// only for the driver of the trip. The channels are those the server posts to: both ends of the trip
// and the team's channels. A post is there once Telegram gave it an id; before that it waits in the
// queue, sent at the publishing to every channel of a trip that has not left yet.
export async function tripPublicity(
  deps: PublicityDeps,
  driverId: number,
  tripId: string,
): Promise<TripPublicity | undefined> {
  const trip = await deps.trip(tripId);
  if (trip?.driverId !== driverId) return undefined;
  const [places, list, posts, views] = await Promise.all([
    deps.places(),
    deps.channels(),
    deps.posts.byTrip(tripId),
    deps.views.count(tripId),
  ]);
  const reached = new Set(channelsOf(trip.from, trip.to, places, list));
  const saved = new Set(posts.map((post) => post.channel));
  const waiting = trip.live && trip.departAt > deps.now();
  const channels = list
    .filter((channel) => reached.has(channel.username))
    .map(({ username, title }) => ({
      username,
      title,
      posted: deps.enabled && (saved.has(username) || waiting),
    }));
  return { channels, views, link: deps.link(tripId) };
}

// A person opened the trip in the app: each person counts once, the driver never (G63, docs/119).
export async function recordView(
  deps: Pick<PublicityDeps, 'trip' | 'views' | 'now'>,
  tripId: string,
  userId: number,
): Promise<void> {
  const trip = await deps.trip(tripId);
  if (trip && trip.driverId !== userId) await deps.views.record(tripId, userId, deps.now());
}
