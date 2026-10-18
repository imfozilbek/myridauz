import type { Bindings } from '../../env';
import { joinedAtOf } from '../users';
import { brandOf } from '../../shared/brand/brand-of';
import type { HeardDeps, MyChannelsDeps } from './application/my-channels';
import { channelDaysOf, healthStoreOf, postReactionsOf } from './health-deps';
import { createMemoryChannelMembers, d1ChannelMembers } from './infrastructure/channel-members';

const localMembers = createMemoryChannelMembers();
// The people of the waitlist are the brand's too (G83): set by the app, waitlist depends on channels.
type Known = (env: Bindings, userId: number) => Promise<boolean>;
let knownElsewhere: Known = async () => false;
export const wireKnownPeople = (known: Known) => void (knownElsewhere = known);
export const membersOf = (env: Bindings) => (env.DB ? d1ChannelMembers(env.DB) : localMembers);

// «Kanallar» of a person (docs/119): the members from D1; the channels the bot may not post in and
// the links «Rida ilovasi» from the hourly check (G75, docs/176).
export const myChannelsDeps = (env: Bindings): MyChannelsDeps => ({
  zones: brandOf(env).channels,
  members: membersOf(env),
  health: () => healthStoreOf(env).rows(),
});

// What the bot of the posts hears (docs/176): the channels of the brand, the people of the brand and
// of the waitlist (G83).
export const heardDeps = (env: Bindings): HeardDeps => ({
  members: membersOf(env),
  chats: new Set(brandOf(env).channels.map(({ chat }) => chat)),
  registered: async (userId) =>
    (await joinedAtOf(env, userId)) !== undefined || (await knownElsewhere(env, userId)),
  days: channelDaysOf(env),
  reactions: postReactionsOf(env),
});
