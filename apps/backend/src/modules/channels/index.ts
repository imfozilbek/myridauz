import { loadBrand } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { closeDeparted, postTrip, refreshPosts, rememberPost } from './application/channels';
import { allChannels, type TeamChannelsDeps } from './application/team';
import { channelRoutes } from './http/channel-routes';
import { botIsAdmin } from './infrastructure/bot-admin';
import type { ChannelsDeps } from './application/ports';
import { createMemoryChannelPosts, d1ChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';
import { createMemoryTeamChannels, d1TeamChannels } from './infrastructure/team-channels';

const localPosts = createMemoryChannelPosts();
const localTeam = createMemoryTeamChannels();

// The region channels of the brand and the channels the team added in the admin (docs/63).
async function teamDeps(env: Bindings): Promise<TeamChannelsDeps> {
  const places = await placesOf(env);
  return {
    fixed: loadBrand(env.BRAND).channels,
    titleOf: (id) => places.get(id)?.name,
    store: env.DB ? d1TeamChannels(env.DB) : localTeam,
    botIsAdmin: botIsAdmin((input, init) => fetch(input, init), env.PASSENGER_BOT_TOKEN),
    now: () => Date.now(),
  };
}

// The trip as the search shows it: set by the app, so channels does not depend on trips (app.ts).
type TripOf = (env: Bindings, id: string) => Promise<Trip | undefined>;

const channelsDeps = (env: Bindings, tripOf: TripOf): ChannelsDeps => {
  const brand = loadBrand(env.BRAND);
  return {
    // Off until the owner approves the post (docs/33): "on" in brands/<brand>/wrangler.toml.
    enabled: env.CHANNEL_POSTS === 'on',
    channels: async () => allChannels(await teamDeps(env)),
    places: () => placesOf(env),
    trip: (id) => tripOf(env, id),
    posts: env.DB ? d1ChannelPosts(env.DB) : localPosts,
    render: channelPost(brand.bots.passenger),
    send: (jobs) => notify(env, jobs),
    now: () => Date.now(),
  };
};

// Channel posts of trips (docs/15): a new trip is posted, a changed trip edits its posts.
export const channels = (tripOf: TripOf) => ({
  posted: (env: Bindings, tripId: string) => postTrip(channelsDeps(env, tripOf), tripId),
  changed: (env: Bindings, tripId: string) => refreshPosts(channelsDeps(env, tripOf), tripId),
  remember: (env: Bindings, post: { tripId: string; channel: string; shown: string }, messageId: number) =>
    rememberPost(channelsDeps(env, tripOf), { ...post, messageId }, post.shown),
  // The Cron job: posts of trips that left stop offering seats (docs/15).
  departed: (env: Bindings) => closeDeparted(channelsDeps(env, tripOf)),
});

// The team's channels in the admin Mini App (docs/63).
export const channelsModule = channelRoutes(teamDeps);
