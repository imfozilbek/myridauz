import { channelOf, loadBrand, type BrandConfig } from '@platform/brands';
import { channelVia, tripBookLink, TRIPS_PATH, VIA_DRIVER, type Trip } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { claimZoneInvite } from '../users';
import { closeDeparted, closePosts, postTrip, refreshPosts, rememberPost } from './application/channels';
import { inviteToZone, tellsHome, type ZoneInviteDeps } from './application/zone-invite';
import { allChannels, type TeamChannelsDeps } from './application/team';
import { channelRoutes } from './http/channel-routes';
import { publicityRoutes } from './http/publicity-routes';
import { botIsAdmin, inChannel } from './infrastructure/bot-admin';
import type { ChannelsDeps } from './application/ports';
import type { PublicityDeps, TripFacts } from './application/publicity';
import { createMemoryChannelPosts, d1ChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';
import { createMemoryTeamChannels, d1TeamChannels } from './infrastructure/team-channels';
import { createMemoryTripViews, d1TripViews } from './infrastructure/trip-views';
import { zoneMessage } from './infrastructure/zone-message';

const localPosts = createMemoryChannelPosts();
const localTeam = createMemoryTeamChannels();
const localViews = createMemoryTripViews();
const postsOf = (env: Bindings) => (env.DB ? d1ChannelPosts(env.DB) : localPosts);
const viewsOf = (env: Bindings) => (env.DB ? d1TripViews(env.DB) : localViews);

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
    posts: postsOf(env),
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
  // «Yoʻlga chiqdim» of the driver: the posts of the trip stop offering seats at once (G63).
  left: (env: Bindings, tripId: string) => closePosts(channelsDeps(env, tripOf), tripId),
});

// The team's channels in the admin Mini App (docs/63).
export const channelsModule = channelRoutes(teamDeps);

const zoneDeps = (env: Bindings, brand: BrandConfig): ZoneInviteDeps => ({
  enabled: env.CHANNEL_POSTS === 'on',
  claim: (userId) => claimZoneInvite(env, userId),
  inChannel: inChannel((input, init) => fetch(input, init), env.PASSENGER_BOT_TOKEN),
  message: zoneMessage(brand),
  send: (jobs) => notify(env, jobs),
});

// The registration knows the zone only from the mark of a channel post the person came by (docs/116).
export const inviteFromMark = async (env: Bindings, userId: number, via: string | undefined) => {
  const brand = loadBrand(env.BRAND);
  const zone = brand.channels.find((channel) => channelVia(channel.username) === via);
  if (zone) await inviteToZone(zoneDeps(env, brand), userId, zone);
};

// Otherwise the first search of the person tells where they live: its «Qayerdan» (docs/119). The map
// is no sign: it names a moving pin, and often answers from the cache of the phone.
export const zoneWatch = new Hono<AppEnv>().use(TRIPS_PATH, async (context, next) => {
  await next();
  const from = context.req.query('from');
  const { app, user } = context.get('session');
  if (context.req.method !== 'GET' || context.res.status !== 200 || !from || app !== 'passenger') return;
  if (!tellsHome((await placesOf(context.env)).get(from))) return;
  const brand = loadBrand(context.env.BRAND);
  await inviteToZone(zoneDeps(context.env, brand), user.id, channelOf(brand, from));
});

// The facts of the driver's trip: set by the app, so channels does not depend on trips (app.ts).
type TripFactsOf = (env: Bindings, id: string) => Promise<TripFacts | undefined>;

const publicityDeps = (env: Bindings, tripOf: TripFactsOf): PublicityDeps => ({
  enabled: env.CHANNEL_POSTS === 'on',
  trip: (id) => tripOf(env, id),
  places: () => placesOf(env),
  channels: async () => allChannels(await teamDeps(env)),
  posts: postsOf(env),
  views: viewsOf(env),
  link: (tripId) => tripBookLink(loadBrand(env.BRAND).bots.passenger, tripId, VIA_DRIVER),
  now: () => Date.now(),
});

// What the driver sees after the publishing, and the views of the trip page (G63, docs/119).
export const publicityModule = (tripOf: TripFactsOf) => publicityRoutes((env) => publicityDeps(env, tripOf));
// A deleted account (docs/30): the trips it opened forget it.
export const forgetTripViews = (env: Bindings, userId: number) => viewsOf(env).forget(userId);
