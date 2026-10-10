import type { PitakStatus } from '@platform/contracts';
import type { PitakRepository } from '../application/ports';
import type { DirectionRecord, PitakRecord } from '../domain/pitak';

// Tables pitaks, pitak_directions and pitak_log (migrations/0024_pickup_modes_pitaks.sql, 0061).
type PitakRow = {
  id: string;
  name: string;
  hint: string | null;
  lat: number;
  lng: number;
  region_id: string;
  status: PitakStatus;
  created_at: number;
  updated_at: number;
};
type DirectionRow = { from_region: string; to_region: string; pitak_id: string | null; updated_at: number };
type ChangeRow = {
  subject: string;
  before: string | null;
  after: string | null;
  by_user: number;
  at: number;
};

const toPitak = (row: PitakRow): PitakRecord => ({
  id: row.id,
  name: row.name,
  hint: row.hint,
  point: { lat: row.lat, lng: row.lng },
  regionId: row.region_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const toDirection = (row: DirectionRow): DirectionRecord => ({
  from: row.from_region,
  to: row.to_region,
  pitakId: row.pitak_id,
  updatedAt: row.updated_at,
});

const SAVE_PITAK = `INSERT INTO pitaks (id, name, hint, lat, lng, region_id, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET name = excluded.name, hint = excluded.hint,
  lat = excluded.lat, lng = excluded.lng, region_id = excluded.region_id, status = excluded.status,
  updated_at = excluded.updated_at`;
const SAVE_DIRECTION = `INSERT INTO pitak_directions (from_region, to_region, pitak_id, updated_at) VALUES (?, ?, ?, ?)
  ON CONFLICT (from_region, to_region) DO UPDATE SET pitak_id = excluded.pitak_id, updated_at = excluded.updated_at`;
const ONE_DIRECTION = 'SELECT * FROM pitak_directions WHERE from_region = ? AND to_region = ?';

export const d1Pitaks = (db: D1Database): PitakRepository => ({
  all: async () =>
    (await db.prepare('SELECT * FROM pitaks ORDER BY region_id, name').all<PitakRow>()).results.map(toPitak),
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM pitaks WHERE id = ?').bind(id).first<PitakRow>();
    return row ? toPitak(row) : undefined;
  },
  save: async (p) => {
    const values = [
      p.id,
      p.name,
      p.hint,
      p.point.lat,
      p.point.lng,
      p.regionId,
      p.status,
      p.createdAt,
      p.updatedAt,
    ];
    await db
      .prepare(SAVE_PITAK)
      .bind(...values)
      .run();
  },
  directions: async () =>
    (
      await db.prepare('SELECT * FROM pitak_directions ORDER BY from_region, to_region').all<DirectionRow>()
    ).results.map(toDirection),
  direction: async (from, to) => {
    const row = await db.prepare(ONE_DIRECTION).bind(from, to).first<DirectionRow>();
    return row ? toDirection(row) : undefined;
  },
  saveDirection: async ({ from, to, pitakId, updatedAt }) => {
    await db.prepare(SAVE_DIRECTION).bind(from, to, pitakId, updatedAt).run();
  },
  removeDirection: async (from, to) => {
    const sql = 'DELETE FROM pitak_directions WHERE from_region = ? AND to_region = ?';
    return (await db.prepare(sql).bind(from, to).run()).meta.changes === 1;
  },
  log: async ({ subject, before, after, by, at }) => {
    const sql = 'INSERT INTO pitak_log (subject, before, after, by_user, at) VALUES (?, ?, ?, ?, ?)';
    await db.prepare(sql).bind(subject, before, after, by, at).run();
  },
  history: async (limit) => {
    const sql = 'SELECT subject, before, after, by_user, at FROM pitak_log ORDER BY at DESC, id DESC LIMIT ?';
    const { results } = await db.prepare(sql).bind(limit).all<ChangeRow>();
    return results.map(({ subject, before, after, by_user: by, at }) => ({ subject, before, after, by, at }));
  },
});
