import type { BrandChannel } from '@platform/brands';
import type { MyChannel } from '@platform/contracts';

// One join or leave the bot of the posts heard in a channel (chat_member, docs/176).
export type MemberChange = {
  readonly chat: string;
  readonly userId: number;
  readonly member: boolean;
  readonly at: number;
};

// Who is in which channel of the brand, as the bot of the posts heard it.
export type ChannelMembers = {
  joined(userId: number): Promise<ReadonlySet<string>>;
  mark(change: MemberChange): Promise<void>;
  forget(userId: number): Promise<void>;
};

export type MyChannelsDeps = {
  // The channels of the directions of the brand (docs/176).
  readonly zones: readonly BrandChannel[];
  readonly members: ChannelMembers;
  // The channels the last check found the bot may not post in (G75): not there for people.
  readonly broken: () => Promise<ReadonlySet<string>>;
};

// «Kanallar» of a person (G65, docs/119): every channel the bot can post in, «✓ Aʼzosiz» on the ones
// the person is in. Two reads of D1, never a call a channel to Telegram (docs/117).
export async function myChannels(deps: MyChannelsDeps, userId: number): Promise<MyChannel[]> {
  const [joined, broken] = await Promise.all([deps.members.joined(userId), deps.broken()]);
  return deps.zones
    .filter(({ chat }) => !broken.has(chat))
    .map(({ chat }) => ({ chat, member: joined.has(chat) }));
}

export type HeardDeps = {
  readonly members: ChannelMembers;
  // The chats of the channels of the brand.
  readonly chats: ReadonlySet<string>;
  readonly registered: (userId: number) => Promise<boolean>;
};

// Only the channels of the brand and only the people of the brand are kept: the id of anyone else
// is never stored (docs/30).
export async function heard(deps: HeardDeps, change: MemberChange): Promise<void> {
  if (!deps.chats.has(change.chat) || !(await deps.registered(change.userId))) return;
  await deps.members.mark(change);
}
