import {
  CHANNEL_ARRIVALS_DAYS,
  channelVia,
  DAY_MS,
  FAILED_POSTS_DAYS,
  type Channel,
  type ChannelHealth,
} from '@platform/contracts';

// What the Cron last read from Telegram about a channel (G75).
export type HealthRow = {
  readonly channel: string;
  readonly subscribers: number | null;
  readonly canPost: boolean | null;
  readonly checkedAt: number;
};

export type HealthStore = {
  rows(): Promise<HealthRow[]>;
  save(row: HealthRow): Promise<void>;
};

export type HealthDeps = {
  readonly channels: () => Promise<Channel[]>;
  readonly store: HealthStore;
  readonly count: (username: string) => Promise<number | null>;
  readonly canPost: (username: string) => Promise<boolean>;
  // The posts Telegram never took, by channel; the people who came by the marks of the channels.
  readonly failed: (since: number) => Promise<ReadonlyMap<string, number>>;
  readonly arrivals: (since: number) => Promise<ReadonlyMap<string, number>>;
  readonly now: () => number;
};

// Two calls to Telegram a channel: a few channels an hour keep the Cron light (docs/117), the oldest
// check first, never checked first of all.
export const CHECKED_PER_RUN = 3;

// The hourly Cron job: the channels checked the longest ago are read again.
export async function checkChannels(deps: HealthDeps): Promise<void> {
  const [channels, rows] = await Promise.all([deps.channels(), deps.store.rows()]);
  const checked = new Map(rows.map((row) => [row.channel, row.checkedAt]));
  const due = [...channels]
    .sort((a, b) => (checked.get(a.username) ?? 0) - (checked.get(b.username) ?? 0))
    .slice(0, CHECKED_PER_RUN);
  for (const { username } of due) {
    const [subscribers, canPost] = await Promise.all([
      deps.count(username),
      deps.canPost(username).catch(() => null),
    ]);
    await deps.store.save({ channel: username, subscribers, canPost, checkedAt: deps.now() });
  }
}

// «Kanallar» of the owner: every channel with its people, its bot, its lost posts and its arrivals.
export async function channelHealth(deps: HealthDeps): Promise<ChannelHealth> {
  const now = deps.now();
  const [channels, rows, failed, arrivals] = await Promise.all([
    deps.channels(),
    deps.store.rows(),
    deps.failed(now - FAILED_POSTS_DAYS * DAY_MS),
    deps.arrivals(now - CHANNEL_ARRIVALS_DAYS * DAY_MS),
  ]);
  const byChannel = new Map(rows.map((row) => [row.channel, row]));
  return {
    channels: channels.map(({ username, title }) => {
      const row = byChannel.get(username);
      return {
        username,
        title,
        subscribers: row?.subscribers ?? null,
        canPost: row?.canPost ?? null,
        checkedAt: row?.checkedAt ?? null,
        failed: failed.get(username) ?? 0,
        arrivals: arrivals.get(channelVia(username)) ?? 0,
      };
    }),
  };
}
