import { PLACE_KINDS, type PlaceKind } from '@platform/contracts';
import type { PlaceIndex, PlaceQuery } from '../application/ports';

// The search index in D1 (G23, docs/67): FTS5 finds the places whose words start with every word
// asked, only in the cells near the start of the trip when there are cells, and D1 orders them:
// nearest first on a flat map around the start, or the shortest names first. The words are
// search keys, only a to z and 0 to 9: they go into the query safely in quotes.
type Row = { name: string; kind: string; area: string | null; lat: number; lng: number };

const KINDS: readonly string[] = PLACE_KINDS;
const isKind = (kind: string): kind is PlaceKind => KINDS.includes(kind);
const quoted = (word: string) => `"${word}"`;
const SELECT = 'SELECT name, kind, area, lat, lng FROM map_places WHERE map_places MATCH ?1';
const NEAREST = `${SELECT} ORDER BY (lat - ?3) * (lat - ?3) + (lng - ?4) * (lng - ?4) * ?5 LIMIT ?2`;
const SHORTEST = `${SELECT} ORDER BY length(name) LIMIT ?2`;

function matchOf({ words, cells }: PlaceQuery) {
  const asked = `words : (${words.map((word) => `${quoted(word)}*`).join(' ')})`;
  return cells ? `${asked} AND cell : (${cells.map(quoted).join(' OR ')})` : asked;
}

export const d1PlaceIndex = (db: D1Database): PlaceIndex => ({
  find: async (query, limit) => {
    const { near } = query;
    const statement = near
      ? db
          .prepare(NEAREST)
          .bind(matchOf(query), limit, near.lat, near.lng, Math.cos((near.lat * Math.PI) / 180) ** 2)
      : db.prepare(SHORTEST).bind(matchOf(query), limit);
    const { results } = await statement.all<Row>();
    return results.flatMap(({ name, kind, area, lat, lng }) =>
      isKind(kind) ? [{ name, kind, area, point: { lat, lng } }] : [],
    );
  },
});
