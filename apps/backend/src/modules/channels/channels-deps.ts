import type { Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { notifyMass } from '../notifications';
import type { ChannelsDeps } from './application/ports';
import { allChannels } from './application/team';
import { createMemoryChannelPosts, d1ChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';
import { teamDeps } from './team-deps';
import { brandOf } from '../../shared/brand/brand-of';

const localPosts = createMemoryChannelPosts();
export const postsOf = (env: Bindings) => (env.DB ? d1ChannelPosts(env.DB) : localPosts);

// The trip as the search shows it: set by the app, so channels does not depend on trips (app.ts).
export type TripOf = (env: Bindings, id: string) => Promise<Trip | undefined>;

// The posts of trips in the channels and groups of the directions (docs/15, docs/176, docs/222).
export const channelsDeps = (env: Bindings, tripOf: TripOf): ChannelsDeps => {
  const brand = brandOf(env);
  return {
    // Off until the owner approves the post (docs/33): "on" in brands/<brand>/wrangler.toml.
    enabled: env.CHANNEL_POSTS === 'on',
    channels: async () => allChannels(await teamDeps(env)),
    places: () => placesOf(env),
    trip: (id) => tripOf(env, id),
    posts: postsOf(env),
    render: channelPost(brand.bots.passenger),
    send: (jobs) => notifyMass(env, jobs),
    now: () => Date.now(),
  };
};
