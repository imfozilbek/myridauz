import type { TalkRepository } from '../application/offer-ports';
import type { TalkRecord } from '../domain/talk';
import { allIn } from '../../../shared/storage/in-list';

type Row = { id: string; request_id: string; driver_id: number; created_at: number };
const toTalk = (row: Row): TalkRecord => ({
  id: row.id,
  requestId: row.request_id,
  driverId: row.driver_id,
  createdAt: row.created_at,
});
const PAIR = 'SELECT * FROM request_talks WHERE request_id = ? AND driver_id = ?';

// Table request_talks (migrations/0051_request_talks.sql): the unique pair keeps one talk even when
// two taps come at once; the second reads the first.
export const d1Talks = (db: D1Database): TalkRepository => ({
  open: async (talk) => {
    await db
      .prepare(
        `INSERT INTO request_talks (id, request_id, driver_id, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (request_id, driver_id) DO NOTHING`,
      )
      .bind(talk.id, talk.requestId, talk.driverId, talk.createdAt)
      .run();
    const row = await db.prepare(PAIR).bind(talk.requestId, talk.driverId).first<Row>();
    return row ? toTalk(row) : talk;
  },
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM request_talks WHERE id = ?').bind(id).first<Row>();
    return row ? toTalk(row) : undefined;
  },
  byDriver: async (driverId) =>
    (
      await db.prepare('SELECT * FROM request_talks WHERE driver_id = ?').bind(driverId).all<Row>()
    ).results.map(toTalk),
  byRequests: async (requestIds) =>
    (
      await allIn<Row>(
        db,
        (marks) => `SELECT * FROM request_talks WHERE request_id IN (${marks})`,
        requestIds,
      )
    ).map(toTalk),
});
