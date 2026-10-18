import { tashkentDate } from '@platform/contracts';

// How many came to a channel and left it over some days (G87 V5, docs/176).
export type ChannelMoves = { readonly chat: string; readonly joined: number; readonly gone: number };

// The life of the channels by day: only numbers, never who (docs/29).
export type ChannelDays = {
  // One person came (true) or left (false) on a day.
  moved(chat: string, day: string, joined: boolean): Promise<void>;
  // The people in the channel when the hourly check read it on a day.
  counted(chat: string, day: string, members: number): Promise<void>;
  // The moves of every channel from a day on.
  movesSince(day: string): Promise<ChannelMoves[]>;
};

// A join or a leave the bot of the posts heard: was and is in the channel before and after it, so a
// change of rights (a member made an admin) is no move.
export type ChannelMove = {
  readonly chat: string;
  readonly was: boolean;
  readonly is: boolean;
  readonly at: number;
};

export async function countMove(days: ChannelDays, move: ChannelMove): Promise<void> {
  if (move.was === move.is) return;
  await days.moved(move.chat, tashkentDate(move.at), move.is);
}
