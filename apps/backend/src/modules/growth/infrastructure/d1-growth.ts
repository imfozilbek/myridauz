import { AUTHOR_CODE_LENGTH, SHARE_MOMENTS, type ShareMoment } from '@platform/contracts';
import { randomCode } from '../../../shared/codes/random-code';
import type { GrowthStore } from '../application/ports';

// A clash of two random codes is rare; the next try takes a new code.
const CODE_TRIES = 3;
const isMoment = (value: string): value is ShareMoment =>
  (SHARE_MOMENTS as readonly string[]).includes(value);
// A ride that happened (docs/129): a completed seat the driver did not mark as a no-show.
const RODE = "status = 'completed' AND no_show_at IS NULL";

// The codes, the people they brought and the moments offered, in D1 (migration 0069).
export function d1Growth(db: D1Database): GrowthStore {
  const knownCode = async (userId: number) =>
    (await db.prepare('SELECT code FROM user_codes WHERE user_id = ?').bind(userId).first<{ code: string }>())
      ?.code;
  return {
    codeOf: async (userId) => {
      const known = await knownCode(userId);
      if (known) return known;
      for (let attempt = 0; attempt < CODE_TRIES; attempt += 1) {
        await db
          .prepare('INSERT INTO user_codes (user_id, code) VALUES (?, ?) ON CONFLICT DO NOTHING')
          .bind(userId, randomCode(AUTHOR_CODE_LENGTH))
          .run();
        const made = await knownCode(userId);
        if (made) return made;
      }
      throw new Error('growth.no_code');
    },
    // Rode: a seat ridden, or a trip driven to its end (docs/116 «пришли, зарегистрировались, поехали»).
    impactOf: async (userId) => {
      const row = await db
        .prepare(
          'SELECT COUNT(*) AS joined, COALESCE(SUM(' +
            `EXISTS (SELECT 1 FROM bookings WHERE passenger_id = a.user_id AND ${RODE}) OR ` +
            "EXISTS (SELECT 1 FROM trips WHERE driver_id = a.user_id AND status = 'completed')" +
            '), 0) AS rode FROM user_arrivals a WHERE a.inviter_id = ?',
        )
        .bind(userId)
        .first<{ joined: number; rode: number }>();
      return { joined: row?.joined ?? 0, rode: row?.rode ?? 0 };
    },
    offered: async (userId) => {
      const { results } = await db
        .prepare('SELECT moment FROM share_moments WHERE user_id = ?')
        .bind(userId)
        .all<{ moment: string }>();
      return results.map((row) => row.moment).filter(isMoment);
    },
    offer: async (userId, moment, at) => {
      await db
        .prepare('INSERT INTO share_moments (user_id, moment, at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING')
        .bind(userId, moment, at)
        .run();
    },
    // The first approval: a new car approved later is not a new driver.
    approvedAt: async (userId) =>
      (
        await db
          .prepare(
            "SELECT MIN(decided_at) AS at FROM application_log WHERE user_id = ? AND status = 'approved'",
          )
          .bind(userId)
          .first<{ at: number | null }>()
      )?.at ?? null,
  };
}
