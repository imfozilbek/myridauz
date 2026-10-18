type ChannelKeys = { readonly chat: string; readonly name: string | null };

// The post of a channel with the most reactions of a week (G87 V6, docs/176).
export type TopPost = { readonly messageId: number; readonly reactions: number };

// The reactions on the posts of trips: only numbers, reactions in channels are anonymous.
export type PostReactions = {
  // The reactions of a post now; a post that is no trip of ours keeps nothing. A channel is kept by
  // its number or, a channel of the team, by its public name (docs/63).
  set(channel: ChannelKeys, messageId: number, reactions: number, at: number): Promise<void>;
  // The post with the most reactions of each channel among the ones that changed since.
  top(since: number): Promise<ReadonlyMap<string, TopPost>>;
};

// A count of reactions Telegram sent: each kind of reaction with its total (message_reaction_count).
export type ReactionCount = {
  readonly chatId: number;
  readonly username: string | null;
  readonly messageId: number;
  readonly totals: readonly number[];
  readonly at: number;
};

export async function countReactions(reactions: PostReactions, count: ReactionCount): Promise<void> {
  const channel = { chat: String(count.chatId), name: count.username ? `@${count.username}` : null };
  const total = count.totals.reduce((sum, one) => sum + one, 0);
  await reactions.set(channel, count.messageId, total, count.at);
}
