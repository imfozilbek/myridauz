import { DAY_MS, DEPART_EARLY_MS, requestsLinkValue, tashkentDate, type TipStep } from '@platform/contracts';
import { allIn } from '../../../shared/storage/in-list';
import { WEEK_MS, type Tip } from '../domain/tip-rules';
import type { Stopped, TipsDeps } from '../application/ports';
import { D1, D2, D4, D7 } from './driver-stops';
import { P10, P2, P3, REQUEST } from './passenger-stops';

// A run tells at most this many people of one window of a step (docs/117).
const BATCH = 100;
type Row = { userId: number; target?: string; fromId?: string; toId?: string; nextAt?: number };
const STOPS: Readonly<Record<TipStep, string>> = {
  p2: P2,
  p3: P3,
  p10: P10,
  req: REQUEST,
  d1: D1,
  d2: D2,
  d7: D7,
  d4: D4,
};

// P10 opens the search of its route on the day of the next trip.
const targetOf = (row: Row) =>
  row.fromId && row.toId && row.nextAt
    ? requestsLinkValue(row.fromId, row.toId, tashkentDate(row.nextAt))
    : row.target;

// The trips on the road now (onTheWay of docs/35): pressed «Yoʻlga chiqdim», or their time came; not
// arrived. A trip lasts less than 2 days.
const ROAD = `WITH road AS (SELECT id, driver_id FROM trips
    WHERE status IN ('active', 'full') AND depart_at >= ?1 AND depart_at <= ?2 AND arrived_at IS NULL
      AND (departed_at IS NOT NULL OR COALESCE(depart_until, depart_at) <= ?3))
  SELECT driver_id AS id FROM road
  UNION SELECT b.passenger_id FROM road r JOIN bookings b ON b.trip_id = r.id AND b.status = 'confirmed'`;
const ROAD_FROM_MS = 2 * DAY_MS;

// Not deleted, not blocked by the team (also by the phone), the bot not stopped (G46).
const REACHABLE = (marks: string) => `SELECT u.id AS id FROM users u
  WHERE NOT EXISTS (SELECT 1 FROM bot_blocks k WHERE k.chat_id = u.id AND k.bot = ?)
    AND u.id IN (${marks}) AND u.deleted_at IS NULL AND u.blocked = 0
    AND NOT EXISTS (SELECT 1 FROM blocked_phones f WHERE f.phone = u.phone)`;
const JOURNAL = (marks: string) =>
  `SELECT user_id AS userId, step, sent_at AS sentAt FROM tips WHERE user_id IN (${marks})`;
const RECORD = 'INSERT INTO tips (user_id, step, sent_at) VALUES (?1, ?2, ?3)';

type Store = Omit<TipsDeps, 'bonus' | 'send' | 'now'>;

// Tables tips and tips_off (migration 0089) and the tables of the stops.
export const d1Tips = (db: D1Database): Store => ({
  stopped: async (step, { from, to }, now) => {
    const { results } = await db
      .prepare(STOPS[step])
      .bind(from, to, now, BATCH, now - WEEK_MS)
      .all<Row>();
    return results.map((row): Stopped => {
      const target = targetOf(row);
      return target ? { userId: row.userId, step, target } : { userId: row.userId, step };
    });
  },
  reachable: async (ids, bot) => {
    const rows = await allIn<{ id: number }>(db, REACHABLE, ids, [bot]);
    return new Set(rows.map((row) => row.id));
  },
  onTheRoad: async (now) => {
    const bound = db.prepare(ROAD).bind(now - ROAD_FROM_MS, now + DEPART_EARLY_MS, now);
    const { results } = await bound.all<{ id: number }>();
    return new Set(results.map((row) => row.id));
  },
  journal: (ids) => allIn<Tip>(db, JOURNAL, ids),
  record: async (tips) => {
    if (tips.length === 0) return;
    await db.batch(tips.map((tip) => db.prepare(RECORD).bind(tip.userId, tip.step, tip.sentAt)));
  },
});

// «Kerak emas» under a tip (docs/232), and a deleted account (docs/30).
export const d1TipsOff = (db: D1Database, userId: number, at: number) =>
  db.prepare('INSERT OR IGNORE INTO tips_off (user_id, off_at) VALUES (?1, ?2)').bind(userId, at).run();
export const d1ForgetTips = (db: D1Database, userId: number) =>
  db.batch([
    db.prepare('DELETE FROM tips WHERE user_id = ?1').bind(userId),
    db.prepare('DELETE FROM tips_off WHERE user_id = ?1').bind(userId),
  ]);
