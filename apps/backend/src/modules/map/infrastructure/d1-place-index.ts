import { PLACE_KINDS, type FoundPlace, type PlaceKind, type Point } from '@platform/contracts';
import type { PlaceIndex, PlaceQuery } from '../application/ports';

// The search index in D1 (G23, docs/67): FTS5 finds the places whose words start with every word
// asked, only in the cells near the start of the trip when there are cells, and D1 orders them:
// nearest first on a flat map around the start, or the shortest names first. The words are
// search keys, only a to z and 0 to 9: they go into the query safely in quotes.
type Row = {
  name: string;
  kind: string;
  area: string | null;
  district: string | null;
  lat: number;
  lng: number;
};

const KINDS: readonly string[] = PLACE_KINDS;
const isKind = (kind: string): kind is PlaceKind => KINDS.includes(kind);
const quoted = (word: string) => `"${word}"`;
const SELECT = 'SELECT name, kind, area, district, lat, lng FROM map_places WHERE map_places MATCH ?1';
// The districts of a zone come from the directory, never from a person: safe in quotes too.
const within = (districts: readonly string[] | null) =>
  districts ? ` AND district IN (${districts.map((id) => `'${id}'`).join(', ')})` : '';
const nearestSql = (zone: string) =>
  `${SELECT}${zone} ORDER BY (lat - ?3) * (lat - ?3) + (lng - ?4) * (lng - ?4) * ?5 LIMIT ?2`;
const shortestSql = (zone: string) => `${SELECT}${zone} ORDER BY length(name) LIMIT ?2`;

const nearest = (db: D1Database, match: string, limit: number, near: Point, zone = '') =>
  db
    .prepare(nearestSql(zone))
    .bind(match, limit, near.lat, near.lng, Math.cos((near.lat * Math.PI) / 180) ** 2);

const found = (results: Row[]): FoundPlace[] =>
  results.flatMap(({ name, kind, area, district, lat, lng }) =>
    isKind(kind) ? [{ name, kind, area, district, point: { lat, lng } }] : [],
  );

function matchOf({ words, cells }: PlaceQuery) {
  const asked = `words : (${words.map((word) => `${quoted(word)}*`).join(' ')})`;
  return cells ? `${asked} AND cell : (${cells.map(quoted).join(' OR ')})` : asked;
}

export const d1PlaceIndex = (db: D1Database): PlaceIndex => ({
  find: async (query, limit) => {
    const { near } = query;
    const zone = within(query.districts);
    const statement = near
      ? nearest(db, matchOf(query), limit, near, zone)
      : db.prepare(shortestSql(zone)).bind(matchOf(query), limit);
    return found((await statement.all<Row>()).results);
  },
  // Cells and kinds are ours, never typed by a person: safe in quotes too.
  around: async ({ cells, kinds, near }, limit) => {
    const match = `${cells.column} : (${cells.list.map(quoted).join(' OR ')}) AND kind : (${kinds.map(quoted).join(' OR ')})`;
    return found((await nearest(db, match, limit, near).all<Row>()).results);
  },
});
