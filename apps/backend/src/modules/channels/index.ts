import { loadBrand } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { postTrip, refreshPosts, rememberPost } from './application/channels';
import type { ChannelsDeps } from './application/ports';
import { createMemoryChannelPosts, d1ChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';

const localPosts = createMemoryChannelPosts();

// The trip as the search shows it: set by the app, so channels does not depend on trips (app.ts).
type TripOf = (env: Bindings, id: string) => Promise<Trip | undefined>;

const channelsDeps = (env: Bindings, tripOf: TripOf): ChannelsDeps => {
  const brand = loadBrand(env.BRAND);
  return {
    // Off until the owner approves the post (docs/33): "on" in brands/<brand>/wrangler.toml.
    enabled: env.CHANNEL_POSTS === 'on',
    channels: brand.channels,
    places: () => placesOf(env),
    trip: (id) => tripOf(env, id),
    posts: env.DB ? d1ChannelPosts(env.DB) : localPosts,
    render: channelPost(brand.bots.passenger),
    send: (jobs) => notify(env, jobs),
  };
};

// Channel posts of trips (docs/15): a new trip is posted, a changed trip edits its posts.
export const channels = (tripOf: TripOf) => ({
  posted: (env: Bindings, tripId: string) => postTrip(channelsDeps(env, tripOf), tripId),
  changed: (env: Bindings, tripId: string) => refreshPosts(channelsDeps(env, tripOf), tripId),
  remember: (env: Bindings, post: { tripId: string; channel: string; shown: string }, messageId: number) =>
    rememberPost(channelsDeps(env, tripOf), { ...post, messageId }, post.shown),
});
