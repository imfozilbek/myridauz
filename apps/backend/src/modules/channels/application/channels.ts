import type { Trip } from '@platform/contracts';
import { channelsOf, shownOf } from '../domain/route-channels';
import type { ChannelPost, ChannelsDeps } from './ports';

// A new trip goes to the channels of its regions through the queue; each post id is remembered
// once Telegram gives it (docs/15). Only drivers' trips: passengers' requests never go there.
export async function postTrip(deps: ChannelsDeps, tripId: string): Promise<void> {
  if (!deps.enabled) return;
  const [trip, places, list] = await Promise.all([deps.trip(tripId), deps.places(), deps.channels()]);
  if (!trip || trip.status !== 'active') return;
  const shown = shownOf(trip);
  const channels = channelsOf(trip.from, trip.to, places, list);
  // A post comes without sound: the board of the day is the one sound of a channel (docs/122).
  await deps.send(
    channels.map((channel) => {
      const { text, markup } = deps.render(trip, places, deps.now(), channel);
      const after = { type: 'channelPost' as const, tripId, channel, shown };
      return {
        bot: 'passenger' as const,
        chatId: `@${channel}`,
        html: true,
        silent: true,
        text,
        markup,
        after,
      };
    }),
  );
}

// Each post shows the trip now; a cancelled trip says so, then its post is deleted (docs/122):
// Telegram keeps a post older than 48 hours, it stays with «Safar bekor qilindi».
async function edit(deps: ChannelsDeps, trip: Trip, posts: readonly ChannelPost[]) {
  if (posts.length === 0) return;
  const places = await deps.places();
  const jobs = posts.flatMap((post) => {
    const { text, markup, remove } = deps.render(trip, places, deps.now(), post.channel);
    const chatId = `@${post.channel}`;
    const shown = { bot: 'passenger' as const, chatId, html: true, edit: post.messageId, text, markup };
    return remove ? [shown, { ...shown, remove: true }] : [shown];
  });
  await deps.send(jobs);
}

// Seats taken, the trip full or cancelled: every post of it is edited (docs/15).
export async function refreshPosts(deps: ChannelsDeps, tripId: string): Promise<void> {
  const trip = await deps.trip(tripId);
  if (trip) await edit(deps, trip, await deps.posts.byTrip(tripId));
}

// Telegram gave the post its id. A trip that changed while the post waited in the queue
// (a booking confirmed at once) is edited now: nothing else would edit it.
export async function rememberPost(deps: ChannelsDeps, post: ChannelPost, shown: string): Promise<void> {
  const trip = await deps.trip(post.tripId);
  if (!trip) return;
  await deps.posts.save(post, trip.departAt);
  if (shownOf(trip) !== shown) await edit(deps, trip, [post]);
}

// A trip that left says so in its posts and stops offering seats, once (docs/15).
export async function closePosts(deps: ChannelsDeps, tripId: string): Promise<void> {
  await refreshPosts(deps, tripId);
  await deps.posts.close(tripId);
}

// The Cron job: the posts of trips whose time came; «Yoʻlga chiqdim» closed its posts at once (G63).
export async function closeDeparted(deps: ChannelsDeps): Promise<void> {
  for (const tripId of await deps.posts.departed(deps.now())) await closePosts(deps, tripId);
}
