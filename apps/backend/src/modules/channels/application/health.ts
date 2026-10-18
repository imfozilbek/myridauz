import {
  CHANNEL_ARRIVALS_DAYS,
  CHANNEL_LIFE_DAYS,
  channelVia,
  DAY_MS,
  FAILED_POSTS_DAYS,
  tashkentDate,
  tashkentDayStart,
  type Channel,
  type ChannelHealth,
} from '@platform/contracts';
import type { ChannelDays } from './channel-days';
import type { PostReactions } from './post-reactions';

// What the Cron last read from Telegram about a channel (G75).
export type HealthRow = {
  readonly channel: string;
  readonly subscribers: number | null;
  readonly canPost: boolean | null;
  readonly checkedAt: number;
  // The own invite link «Rida ilovasi» (docs/176): null until the bot made it.
  readonly appLink: string | null;
};

export type HealthStore = {
  rows(): Promise<HealthRow[]>;
  save(row: HealthRow): Promise<void>;
};

export type HealthDeps = {
  readonly channels: () => Promise<Channel[]>;
  readonly store: HealthStore;
  // The people of each check by day, the joins and leaves of a week (G87 V5).
  readonly days: ChannelDays;
  // The post with the most reactions of each channel this week (G87 V6).
  readonly reactions: PostReactions;
  readonly count: (chat: string) => Promise<number | null>;
  readonly canPost: (chat: string) => Promise<boolean>;
  // Makes the invite link «Rida ilovasi» of a channel; null when Telegram did not.
  readonly appLink: (chat: string) => Promise<string | null>;
  // The posts Telegram never took, by channel; the people who came by the marks of the channels.
  readonly failed: (since: number) => Promise<ReadonlyMap<string, number>>;
  readonly arrivals: (since: number) => Promise<ReadonlyMap<string, number>>;
  readonly now: () => number;
};

// Two calls to Telegram a channel, three while it has no link «Rida ilovasi»: a few channels an hour
// keep the Cron light (docs/117, lesson 262), the oldest check first, never checked first of all.
const CHECKED_PER_RUN = 3;

// The hourly Cron job: the channels checked the longest ago are read again. A channel without its link
// «Rida ilovasi» gets it once (docs/176); the link is kept, a failed one is made at the next check.
export async function checkChannels(deps: HealthDeps): Promise<void> {
  const [channels, rows] = await Promise.all([deps.channels(), deps.store.rows()]);
  const before = new Map(rows.map((row) => [row.channel, row]));
  const due = [...channels]
    .sort((a, b) => (before.get(a.chat)?.checkedAt ?? 0) - (before.get(b.chat)?.checkedAt ?? 0))
    .slice(0, CHECKED_PER_RUN);
  for (const { chat } of due) {
    const [subscribers, canPost, appLink] = await Promise.all([
      deps.count(chat),
      deps.canPost(chat).catch(() => null),
      before.get(chat)?.appLink ?? deps.appLink(chat).catch(() => null),
    ]);
    const now = deps.now();
    await deps.store.save({ channel: chat, subscribers, canPost, checkedAt: now, appLink });
    if (subscribers !== null) await deps.days.counted(chat, tashkentDate(now), subscribers);
  }
}

// The links «Rida ilovasi» the checks made, by channel: the app opens them (docs/176).
export async function appLinks(store: HealthStore): Promise<ReadonlyMap<string, string>> {
  return new Map(
    (await store.rows()).flatMap(({ channel, appLink }) => (appLink ? [[channel, appLink] as const] : [])),
  );
}

// «Kanallar» of the owner: every channel with its people, its bot, its lost posts and its arrivals.
export async function channelHealth(deps: HealthDeps): Promise<ChannelHealth> {
  const now = deps.now();
  const week = now - (CHANNEL_LIFE_DAYS - 1) * DAY_MS;
  const [channels, rows, failed, arrivals, moves, top] = await Promise.all([
    deps.channels(),
    deps.store.rows(),
    deps.failed(now - FAILED_POSTS_DAYS * DAY_MS),
    deps.arrivals(now - CHANNEL_ARRIVALS_DAYS * DAY_MS),
    // Today and the six days before it.
    deps.days.movesSince(tashkentDate(week)),
    deps.reactions.top(tashkentDayStart(tashkentDate(week))),
  ]);
  const byChannel = new Map(rows.map((row) => [row.channel, row]));
  const moved = new Map(moves.map((move) => [move.chat, move]));
  return {
    channels: channels.map(({ chat, title }) => {
      const row = byChannel.get(chat);
      return {
        chat,
        title,
        subscribers: row?.subscribers ?? null,
        canPost: row?.canPost ?? null,
        checkedAt: row?.checkedAt ?? null,
        failed: failed.get(chat) ?? 0,
        arrivals: arrivals.get(channelVia(chat)) ?? 0,
        joined: moved.get(chat)?.joined ?? 0,
        left: moved.get(chat)?.gone ?? 0,
        topPost: top.get(chat) ?? null,
      };
    }),
  };
}
