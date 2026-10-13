import type { HealthRow, HealthStore } from '../application/health';

type Row = {
  channel: string;
  subscribers: number | null;
  can_post: number | null;
  checked_at: number;
  app_link: string | null;
};

const SAVE = `INSERT OR REPLACE INTO channel_health (channel, subscribers, can_post, checked_at, app_link)
  VALUES (?1, ?2, ?3, ?4, ?5)`;

// Table channel_health (migrations 0059, 0065): one row a channel, a few dozen rows at most.
export const d1Health = (db: D1Database): HealthStore => ({
  rows: async () =>
    (await db.prepare('SELECT * FROM channel_health').all<Row>()).results.map((row) => ({
      channel: row.channel,
      subscribers: row.subscribers,
      canPost: row.can_post === null ? null : row.can_post === 1,
      checkedAt: row.checked_at,
      appLink: row.app_link,
    })),
  save: async ({ channel, subscribers, canPost, checkedAt, appLink }) => {
    const can = canPost === null ? null : Number(canPost);
    await db.prepare(SAVE).bind(channel, subscribers, can, checkedAt, appLink).run();
  },
});

// Tests and local runs: the same rows in memory.
export function createMemoryHealth(): HealthStore {
  const rows = new Map<string, HealthRow>();
  return {
    rows: async () => [...rows.values()],
    save: async (row) => void rows.set(row.channel, row),
  };
}
