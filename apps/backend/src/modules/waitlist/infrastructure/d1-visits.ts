import type { Visit, VisitStore } from '../application/ports';
import { FRIEND_CODE_LENGTH, randomCode } from '../domain/sources';

type Moment = 'started_at' | 'opened_at' | 'invited_at';

// The first touch of a person in D1 (migration 0066): the first mark and the first platform stay,
// a later link changes nothing (docs/116). The own friend code is made with the row.
export function d1Visits(db: D1Database): VisitStore {
  const read = async (userId: number): Promise<Visit> => {
    const row = await db
      .prepare('SELECT code, via FROM waitlist_visits WHERE telegram_id = ?')
      .bind(userId)
      .first<Visit>();
    return row ?? { code: '', via: null };
  };
  const touch = async (
    userId: number,
    moment: Moment,
    via: string | null,
    platform: string | null,
    now: number,
  ) => {
    await db
      .prepare(
        `INSERT INTO waitlist_visits (telegram_id, code, via, platform, ${moment}) VALUES (?, ?, ?, ?, ?) ` +
          `ON CONFLICT (telegram_id) DO UPDATE SET via = COALESCE(via, excluded.via), ` +
          `platform = COALESCE(platform, excluded.platform), ${moment} = COALESCE(${moment}, excluded.${moment})`,
      )
      .bind(userId, randomCode(FRIEND_CODE_LENGTH), via, platform, now)
      .run();
    return read(userId);
  };
  return {
    of: read,
    started: async (userId, via, now) => void (await touch(userId, 'started_at', via, null, now)),
    opened: (userId, via, platform, now) => touch(userId, 'opened_at', via, platform, now),
    invited: (userId, now) => touch(userId, 'invited_at', null, null, now),
  };
}
