import type { Cadence, Pain, WaitlistRole } from '@platform/contracts';
import type { RecordStore, WaitlistRecord } from '../application/ports';

type Row = {
  readonly telegram_id: number;
  readonly role: WaitlistRole;
  readonly home_region: string;
  readonly region: string;
  readonly cadence: Cadence;
  readonly pains: string;
  readonly via: string | null;
  readonly created_at: number;
  readonly notified_at: number | null;
};

const COLUMNS = 'telegram_id, role, home_region, region, cadence, pains, via, created_at, notified_at';
const toRecord = (row: Row): WaitlistRecord => ({
  userId: row.telegram_id,
  role: row.role,
  home: row.home_region,
  region: row.region,
  cadence: row.cadence,
  pains: row.pains.split(',').filter(Boolean) as Pain[],
  via: row.via,
  createdAt: row.created_at,
  notifiedAt: row.notified_at,
});
const PASSENGER: WaitlistRole = 'passenger';
// A pain inside the list «chats,phone»: the commas at both ends make the match exact.
const HAS_PAIN = `instr(',' || pains || ',', ',' || ? || ',') > 0`;

// The records of the list in D1 (migration 0066): every read goes by the key or an index (docs/117).
export function d1Records(db: D1Database): RecordStore {
  const many = async (sql: string, ...values: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...values)
        .all<Row>()
    ).results.map(toRecord);
  return {
    of: (userId) => many(`SELECT ${COLUMNS} FROM waitlist WHERE telegram_id = ? ORDER BY role DESC`, userId),
    save: async (record, now) => {
      const old = await db
        .prepare('SELECT 1 FROM waitlist WHERE telegram_id = ? AND role = ?')
        .bind(record.userId, record.role)
        .first();
      await db
        .prepare(
          `INSERT INTO waitlist (${COLUMNS}, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?) ` +
            'ON CONFLICT (telegram_id, role) DO UPDATE SET home_region = excluded.home_region, ' +
            'region = excluded.region, cadence = excluded.cadence, pains = excluded.pains, updated_at = excluded.updated_at',
        )
        .bind(
          record.userId,
          record.role,
          record.home,
          record.region,
          record.cadence,
          record.pains.join(','),
          record.via,
          record.createdAt,
          now,
        )
        .run();
      return old === null;
    },
    counts: async (region, pain) => {
      const row = await db
        .prepare(
          `SELECT SUM(role = ?) AS passengers, SUM(role != ?) AS drivers, SUM(role = ? AND ${HAS_PAIN}) AS with_pain ` +
            'FROM waitlist WHERE region = ?',
        )
        .bind(PASSENGER, PASSENGER, PASSENGER, pain, region)
        .first<{ passengers: number | null; drivers: number | null; with_pain: number | null }>();
      return { passengers: row?.passengers ?? 0, drivers: row?.drivers ?? 0, withPain: row?.with_pain ?? 0 };
    },
    // Not told since the opening, and not in the last week: the rule of one ring a week (docs/181).
    untold: (week, limit) =>
      many(
        `SELECT ${COLUMNS.split(', ')
          .map((column) => `w.${column}`)
          .join(', ')} FROM waitlist_openings o ` +
          'JOIN waitlist w ON w.region = o.region WHERE w.notified_at IS NULL ' +
          'OR (w.notified_at < o.opened_at AND w.notified_at < ?) LIMIT ?',
        week,
        limit,
      ),
    told: async ({ userId, role, notifiedAt }, at) => {
      const sql =
        'UPDATE waitlist SET notified_at = ? WHERE telegram_id = ? AND role = ? AND notified_at IS ?';
      return (await db.prepare(sql).bind(at, userId, role, notifiedAt).run()).meta.changes > 0;
    },
    stale: (since, limit) =>
      many(`SELECT ${COLUMNS} FROM waitlist WHERE card_at < ? ORDER BY card_at LIMIT ?`, since, limit),
    shown: async (userId, role, at) => {
      await db
        .prepare('UPDATE waitlist SET card_at = ? WHERE telegram_id = ? AND role = ?')
        .bind(at, userId, role)
        .run();
    },
    forget: async (userId) => {
      await db.batch([
        db.prepare('DELETE FROM waitlist WHERE telegram_id = ?').bind(userId),
        db.prepare('DELETE FROM waitlist_visits WHERE telegram_id = ?').bind(userId),
        db.prepare('DELETE FROM ad_joins WHERE user_id = ?').bind(userId),
      ]);
    },
  };
}
