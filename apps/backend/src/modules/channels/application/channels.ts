import { channelsOf, shownOf } from '../domain/route-channels';
import type { ChannelPost, ChannelsDeps } from './ports';

// A new trip goes to the channels of its regions through the queue; each post id is remembered
// once Telegram gives it (docs/15). Only drivers' trips: passengers' requests never go there.
export async function postTrip(deps: ChannelsDeps, tripId: string): Promise<void> {
  if (!deps.enabled) return;
  const [trip, places] = await Promise.all([deps.trip(tripId), deps.places()]);
  if (!trip || trip.status !== 'active') return;
  const { text, markup } = deps.render(trip, places);
  const shown = shownOf(trip);
  const channels = channelsOf(trip.from, trip.to, places, deps.channels);
  await deps.send(
    channels.map((channel) => ({
      bot: 'passenger' as const,
      chatId: `@${channel}`,
      text,
      ...(markup ? { markup } : {}),
      after: { type: 'channelPost' as const, tripId, channel, shown },
    })),
  );
}

async function edit(deps: ChannelsDeps, tripId: string, posts: readonly ChannelPost[], shown?: string) {
  if (posts.length === 0) return;
  const [trip, places] = await Promise.all([deps.trip(tripId), deps.places()]);
  if (!trip || shownOf(trip) === shown) return;
  const { text, markup } = deps.render(trip, places);
  await deps.send(
    posts.map((post) => ({
      bot: 'passenger' as const,
      chatId: `@${post.channel}`,
      text,
      edit: post.messageId,
      ...(markup ? { markup } : {}),
    })),
  );
}

// Seats taken, the trip full or cancelled: every post of it is edited (docs/15).
export async function refreshPosts(deps: ChannelsDeps, tripId: string): Promise<void> {
  await edit(deps, tripId, await deps.posts.byTrip(tripId));
}

// Telegram gave the post its id. A trip that changed while the post waited in the queue
// (a booking confirmed at once) is edited now: nothing else would edit it.
export async function rememberPost(deps: ChannelsDeps, post: ChannelPost, shown: string): Promise<void> {
  await deps.posts.save(post);
  await edit(deps, post.tripId, [post], shown);
}
