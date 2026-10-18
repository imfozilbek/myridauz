import type { TripPublicity } from '@platform/contracts';
import { channelsOf } from '../domain/route-channels';
import type { ChannelPostStore, ChannelsDeps } from './ports';
import type { TeamChannel } from './team';

// What the publicity needs of a trip: its driver and its ends.
export type TripFacts = {
  readonly driverId: number;
  readonly from: string;
  readonly to: string;
};

// The different people who opened a trip in the app: one row per person and trip (G63, docs/119).
export type TripViewStore = {
  record(tripId: string, userId: number, at: number): Promise<void>;
  count(tripId: string): Promise<number>;
  // A deleted account (docs/30).
  forget(userId: number): Promise<void>;
};

export type PublicityDeps = {
  // The channel posts are on only when the owner switched them on (docs/33).
  readonly enabled: boolean;
  readonly trip: (id: string) => Promise<TripFacts | undefined>;
  readonly places: ChannelsDeps['places'];
  // The channels of the brand and of the team, with their titles and links (docs/63, docs/176).
  readonly channels: () => Promise<readonly TeamChannel[]>;
  // The links «Rida ilovasi» the hourly check made (docs/176): the driver joins by the app's link.
  readonly appLinks: () => Promise<ReadonlyMap<string, string>>;
  readonly posts: Pick<ChannelPostStore, 'byTrip'>;
  readonly views: TripViewStore;
  readonly now: () => number;
};

// «Safaringiz kanalda chiqdi» and «N koʻrdi» (G63, docs/119): only for the driver of the trip; the link
// to send is a card of the loop trip (G88, docs/193). The channels are those the server posts to: both
// ends of the trip and the team's channels. A post is there only once Telegram gave it an id
// (channel_posts): the posts go out at the publishing, so a trip published while they were off, a
// channel added later or a send Telegram refused shows no post.
export async function tripPublicity(
  deps: PublicityDeps,
  driverId: number,
  tripId: string,
): Promise<TripPublicity | undefined> {
  const trip = await deps.trip(tripId);
  if (trip?.driverId !== driverId) return undefined;
  const [places, list, links, posts, views] = await Promise.all([
    deps.places(),
    deps.channels(),
    deps.appLinks(),
    deps.posts.byTrip(tripId),
    deps.views.count(tripId),
  ]);
  const reached = new Set(channelsOf(trip.from, trip.to, places, list));
  const saved = new Set(posts.map((post) => post.channel));
  const channels = list
    .filter((channel) => reached.has(channel.chat))
    .map(({ chat, title, link }) => ({
      chat,
      title,
      link: links.get(chat) ?? link,
      posted: deps.enabled && saved.has(chat),
    }));
  return { channels, views };
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
