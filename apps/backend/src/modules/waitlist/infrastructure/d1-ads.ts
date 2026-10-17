import type { AdResult } from '@platform/contracts';
import type { AdRow, AdStore } from '../application/ports';

type Row = {
  readonly code: string;
  readonly target: AdRow['target'];
  readonly channel: string | null;
  readonly invite_link: string | null;
  readonly place: AdRow['place'];
  readonly name: string;
  readonly price: number | null;
  readonly days: number | null;
  readonly top_hours: number;
  readonly pin_hours: number;
  readonly created_at: number;
};
const toAd = (row: Row): AdRow => ({
  code: row.code,
  target: row.target,
  channel: row.channel,
  invite: row.invite_link,
  place: row.place,
  name: row.name,
  price: row.price,
  days: row.days,
  top: row.top_hours,
  pin: row.pin_hours,
  at: row.created_at,
});
const COLUMNS =
  'code, target, channel, invite_link, place, name, price, days, top_hours, pin_hours, created_at';
// The people an ad brought: by the mark of the main bot link, by the mark kept at the registration
// through a bot of the trips (docs/116), or by the joins of its invite link.
// «via LIKE 'ad-%'» lets the partial index of the ad marks read only them (migration 0070, docs/117).
const ARRIVED = "FROM user_arrivals WHERE via = ?1 AND via LIKE 'ad-%'";
const REGISTERED = `SELECT user_id AS id ${ARRIVED}`;
const BROUGHT = {
  bot: 'SELECT telegram_id AS id FROM waitlist_visits WHERE via = ?1',
  passenger: REGISTERED,
  driver: REGISTERED,
  channel: 'SELECT user_id AS id FROM ad_joins WHERE code = ?1',
} as const;

// The links of the ads and what they gave, in D1 (migration 0066, docs/184).
export function d1Ads(db: D1Database): AdStore {
  const count = async (sql: string, ...values: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...values)
        .first<{ count: number | null }>()
    )?.count ?? 0;
  return {
    add: async (ad, by) => {
      await db
        .prepare(`INSERT INTO ad_links (${COLUMNS}, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          ad.code,
          ad.target,
          ad.channel,
          ad.invite,
          ad.place,
          ad.name,
          ad.price,
          ad.days,
          ad.top,
          ad.pin,
          ad.at,
          by,
        )
        .run();
    },
    all: async () =>
      (await db.prepare(`SELECT ${COLUMNS} FROM ad_links ORDER BY created_at DESC`).all<Row>()).results.map(
        toAd,
      ),
    find: async (code) => {
      const row = await db.prepare(`SELECT ${COLUMNS} FROM ad_links WHERE code = ?`).bind(code).first<Row>();
      return row ? toAd(row) : null;
    },
    count: () => count('SELECT COUNT(*) AS count FROM ad_links'),
    result: async (ad): Promise<AdResult> => {
      const brought = BROUGHT[ad.target];
      const roles = (
        await db
          .prepare(
            `SELECT w.role, COUNT(*) AS count FROM waitlist w WHERE w.telegram_id IN (${brought}) GROUP BY w.role`,
          )
          .bind(ad.code)
          .all<{ role: string; count: number }>()
      ).results;
      const ofRole = (role: string) => roles.find((row) => row.role === role)?.count ?? 0;
      return {
        registered: await count(`SELECT COUNT(*) AS count ${ARRIVED}`, ad.code),
        clicked: await count(
          'SELECT COUNT(*) AS count FROM waitlist_visits WHERE via = ? AND started_at IS NOT NULL',
          ad.code,
        ),
        opened: await count(
          'SELECT COUNT(*) AS count FROM waitlist_visits WHERE via = ? AND opened_at IS NOT NULL',
          ad.code,
        ),
        passengers: ofRole('passenger'),
        drivers: ofRole('driver'),
        joined:
          ad.target === 'channel'
            ? await count('SELECT COUNT(*) AS count FROM ad_joins WHERE code = ?', ad.code)
            : await count(
                `SELECT COUNT(DISTINCT user_id) AS count FROM channel_members WHERE member = 1 AND user_id IN (${brought})`,
                ad.code,
              ),
        stayed: await count(
          'SELECT COUNT(*) AS count FROM ad_joins WHERE code = ? AND left_at IS NULL',
          ad.code,
        ),
        byFriends: await count(
          `SELECT COUNT(*) AS count FROM waitlist_visits v JOIN waitlist w ON w.via = 'fr-' || v.code ` +
            `WHERE v.telegram_id IN (${brought})`,
          ad.code,
        ),
      };
    },
    inviteOf: async (link) =>
      (
        await db
          .prepare('SELECT code FROM ad_links WHERE invite_link = ?')
          .bind(link)
          .first<{ code: string }>()
      )?.code ?? null,
    joined: async (code, userId, chat, at) => {
      await db
        .prepare(
          'INSERT INTO ad_joins (code, user_id, chat, joined_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
        )
        .bind(code, userId, chat, at)
        .run();
    },
    left: async (userId, chat, at) => {
      await db
        .prepare('UPDATE ad_joins SET left_at = ? WHERE user_id = ? AND chat = ? AND left_at IS NULL')
        .bind(at, userId, chat)
        .run();
    },
  };
}
