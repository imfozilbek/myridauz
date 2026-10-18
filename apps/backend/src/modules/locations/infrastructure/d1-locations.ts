import { LOCATION_TYPES, type Location } from '@platform/contracts';
import type { LocationRepository } from '../application/ports';

type LocationRow = {
  id: string;
  parent_id: string | null;
  type: Location['type'];
  lat: number;
  lng: number;
  one_city: number;
  name: string;
};

const toLocation = (row: LocationRow): Location => ({
  id: row.id,
  parentId: row.parent_id,
  type: LOCATION_TYPES.includes(row.type) ? row.type : 'district',
  name: row.name,
  lat: row.lat,
  lng: row.lng,
  oneCity: row.one_city === 1,
});

// Regions in the order of docs/14 (Toshkent first), places inside a region by name.
const DIRECTORY_SQL = `SELECT l.id, l.parent_id, l.type, l.lat, l.lng, l.one_city, t.name
  FROM locations l JOIN location_translations t ON t.location_id = l.id AND t.locale = ?
  ORDER BY l.parent_id IS NOT NULL, l.position, t.name`;

// Tables locations, location_translations, location_distances (migrations/0003_locations.sql).
export const d1Locations = (db: D1Database): LocationRepository => ({
  directory: async (locale) => {
    const [rows, version] = await db.batch([
      db.prepare(DIRECTORY_SQL).bind(locale),
      db.prepare('SELECT MAX(updated_at) AS version FROM locations'),
    ]);
    const stamp = (version?.results[0] as { version: number | null } | undefined)?.version ?? 0;
    return { version: String(stamp), locations: ((rows?.results ?? []) as LocationRow[]).map(toLocation) };
  },
  distance: async (from, to) => {
    const row = await db
      .prepare('SELECT km FROM location_distances WHERE from_id = ? AND to_id = ?')
      .bind(from, to)
      .first<{ km: number }>();
    return row?.km;
  },
  saveDistance: async (from, to, km, at) => {
    await db
      .prepare(
        `INSERT INTO location_distances (from_id, to_id, km, source, updated_at) VALUES (?, ?, ?, 'team', ?)
         ON CONFLICT (from_id, to_id) DO UPDATE SET km = excluded.km, source = 'team', updated_at = excluded.updated_at`,
      )
      .bind(from, to, km, at)
      .run();
  },
  correctDistance: async (from, to, { after, by, at }) => {
    // The change is written with the km before it, then the distance: one batch, one step.
    await db.batch([
      db
        .prepare(
          `INSERT INTO location_distance_changes (from_id, to_id, km_before, km_after, changed_by, changed_at)
           VALUES (?, ?, (SELECT km FROM location_distances WHERE from_id = ? AND to_id = ?), ?, ?, ?)`,
        )
        .bind(from, to, from, to, after, by, at),
      db
        .prepare(
          `INSERT INTO location_distances (from_id, to_id, km, source, updated_at) VALUES (?, ?, ?, 'team', ?)
           ON CONFLICT (from_id, to_id) DO UPDATE SET km = excluded.km, source = 'team', updated_at = excluded.updated_at`,
        )
        .bind(from, to, after, at),
    ]);
  },
  distanceChanges: async (from, to) => {
    const { results } = await db
      .prepare(
        `SELECT km_before AS before, km_after AS after, changed_by AS by, changed_at AS at
         FROM location_distance_changes WHERE from_id = ? AND to_id = ? ORDER BY changed_at DESC`,
      )
      .bind(from, to)
      .all<{ before: number | null; after: number; by: number; at: number }>();
    return results;
  },
});
