import type { Bindings } from '../../env';
import { joinedAtOf } from '../users';
import { brandOf } from '../../shared/brand/brand-of';
import type { HeardDeps, MyChannelsDeps } from './application/my-channels';
import { healthStoreOf } from './health-deps';
import { createMemoryChannelMembers, d1ChannelMembers } from './infrastructure/channel-members';

const localMembers = createMemoryChannelMembers();
export const membersOf = (env: Bindings) => (env.DB ? d1ChannelMembers(env.DB) : localMembers);

// «Kanallar» of a person (docs/119): the members from D1, the channels the bot may not post in from
// the hourly check (G75).
export const myChannelsDeps = (env: Bindings): MyChannelsDeps => ({
  zones: brandOf(env).channels,
  members: membersOf(env),
  broken: async () =>
    new Set(
      (await healthStoreOf(env).rows()).filter((row) => row.canPost === false).map((row) => row.channel),
    ),
});

// What the bot of the posts hears (docs/176): the channels of the brand, the people of the brand.
export const heardDeps = (env: Bindings): HeardDeps => ({
  members: membersOf(env),
  chats: new Set(brandOf(env).channels.map(({ chat }) => chat)),
  registered: async (userId) => (await joinedAtOf(env, userId)) !== undefined,
});
