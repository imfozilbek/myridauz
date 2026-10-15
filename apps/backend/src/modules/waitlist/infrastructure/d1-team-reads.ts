import { HOUR_MS, PAINS, type Cadence, type Pain, type WaitlistRole } from '@platform/contracts';
import type { PainCounts, ReachRow, RoleRow, SideRow, TeamReads } from '../application/ports';

const TASHKENT_MS = 5 * HOUR_MS;
const SLOT_HOURS = 3;
const SLOT_MS = SLOT_HOURS * HOUR_MS;
const SLOTS = 8;
// Each pain counted in one read: «chats,phone» has «chats» when «,chats,» is inside «,chats,phone,».
const PAIN_SUMS = PAINS.map((pain) => `SUM(instr(',' || pains || ',', ',${pain},') > 0) AS ${pain}`).join(
  ', ',
);
const LISTED = 'EXISTS (SELECT 1 FROM waitlist w WHERE w.telegram_id = v.telegram_id)';

// What the team reads of the list (docs/181, docs/183): numbers over the whole table. The answers
// live 10 minutes in the cache of the statistics, as the rest of the dashboard (docs/56).
export function d1TeamReads(db: D1Database): TeamReads {
  const all = async <T>(sql: string, ...values: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...values)
        .all<T>()
    ).results;
  const one = async (sql: string, ...values: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...values)
        .first<{ count: number | null }>()
    )?.count ?? 0;
  const reach = (column: 'via' | 'platform', since: number) =>
    all<ReachRow>(
      `SELECT v.${column} AS key, COUNT(*) AS opened, SUM(${LISTED}) AS listed FROM waitlist_visits v ` +
        `WHERE v.opened_at >= ? GROUP BY v.${column}`,
      since,
    );
  return {
    regions: () => all<RoleRow>('SELECT region, role, COUNT(*) AS count FROM waitlist GROUP BY region, role'),
    pains: async (role: WaitlistRole, region: string | null) => {
      const where = region === null ? 'role = ?' : 'role = ? AND region = ?';
      const row = await db
        .prepare(`SELECT COUNT(*) AS total, ${PAIN_SUMS} FROM waitlist WHERE ${where}`)
        .bind(...(region === null ? [role] : [role, region]))
        .first<Record<'total' | Pain, number | null>>();
      return Object.fromEntries([
        ['total', row?.total ?? 0],
        ...PAINS.map((pain) => [pain, row?.[pain] ?? 0]),
      ]) as PainCounts;
    },
    sides: (region) =>
      all<SideRow>(
        'SELECT role, cadence, COUNT(*) AS count FROM waitlist WHERE region = ? GROUP BY role, cadence',
        region,
      ),
    since: async (region) =>
      (
        await db
          .prepare('SELECT MIN(created_at) AS since FROM waitlist WHERE region = ?')
          .bind(region)
          .first<{ since: number | null }>()
      )?.since ?? null,
    drivers: async (region) =>
      (
        await all<{ telegram_id: number }>(
          "SELECT telegram_id FROM waitlist WHERE region = ? AND role = 'driver'",
          region,
        )
      ).map((row) => row.telegram_id),
    toTell: (region, before) =>
      one(
        'SELECT COUNT(*) AS count FROM waitlist WHERE region = ? AND (notified_at IS NULL OR notified_at < ?)',
        region,
        before,
      ),
    sources: (since) => reach('via', since),
    devices: (since) => reach('platform', since),
    after: async (since) => ({
      listed: await one(
        'SELECT COUNT(DISTINCT telegram_id) AS count FROM waitlist WHERE created_at >= ?',
        since,
      ),
      joined: await one(
        'SELECT COUNT(DISTINCT w.telegram_id) AS count FROM waitlist w WHERE w.created_at >= ? AND EXISTS ' +
          '(SELECT 1 FROM channel_members m WHERE m.user_id = w.telegram_id AND m.member = 1)',
        since,
      ),
      invited: await one('SELECT COUNT(*) AS count FROM waitlist_visits WHERE invited_at >= ?', since),
      byFriends: await one(
        "SELECT COUNT(*) AS count FROM waitlist WHERE created_at >= ? AND via LIKE 'fr-%'",
        since,
      ),
    }),
    hours: async (since) => {
      const rows = await all<{ slot: number; count: number }>(
        `SELECT ((created_at + ${TASHKENT_MS}) / ${SLOT_MS}) % ${SLOTS} AS slot, COUNT(*) AS count FROM waitlist ` +
          'WHERE created_at >= ? GROUP BY slot',
        since,
      );
      return rows.map(({ slot, count }) => ({ from: Math.trunc(slot) * SLOT_HOURS, count }));
    },
    cadences: () =>
      all<{ cadence: Cadence; count: number }>(
        "SELECT cadence, COUNT(*) AS count FROM waitlist WHERE role = 'passenger' GROUP BY cadence",
      ),
    bothRoles: () =>
      one(
        'SELECT COUNT(*) AS count FROM (SELECT telegram_id FROM waitlist GROUP BY telegram_id HAVING COUNT(*) > 1)',
      ),
  };
}
