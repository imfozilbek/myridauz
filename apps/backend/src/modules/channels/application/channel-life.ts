import { DAY_MS, tashkentDate } from '@platform/contracts';

// The life of a channel (G87, docs/191): who joins and leaves by day, its people at the hourly
// check, the reactions of its posts. Counts only, never who.
export type Move = 'joined' | 'gone';
export type Life = {
  readonly joined: number;
  readonly gone: number;
  readonly reactions: number;
  readonly topReactions: number;
};

export type ChannelLife = {
  moved(day: string, chat: string, move: Move): Promise<void>;
  counted(day: string, chat: string, subscribers: number): Promise<void>;
  reacted(chat: string, messageId: number, reactions: number, at: number): Promise<void>;
  // The joins and leaves of the days since, the reactions of the posts that changed since.
  since(day: string, at: number): Promise<ReadonlyMap<string, Life>>;
};

export const NO_LIFE: Life = { joined: 0, gone: 0, reactions: 0, topReactions: 0 };

// A change of a member: joined when not in the channel before, gone when not in it any more.
export const moveOf = (was: boolean, now: boolean): Move | null =>
  was === now ? null : now ? 'joined' : 'gone';

// The life of the last days on «Kanallar» of the owner: today and the days before it.
export const lifeOf = (life: ChannelLife, days: number, now: number) =>
  life.since(tashkentDate(now - (days - 1) * DAY_MS), now - days * DAY_MS);
