import type { PlaceRow } from './place-rows.ts';

// The search index (G23, docs/67): words are the search keys of every spelling, cell the quarter
// degree cell for «near». columnsize=0 keeps no sizes of words: a row fewer to write for each
// place, and D1 counts written rows (docs/61). Migration 0022 creates the same table.
export const PLACE_INDEX_SCHEMA = `CREATE VIRTUAL TABLE map_places USING fts5(
  words,
  cell,
  name UNINDEXED,
  kind UNINDEXED,
  area UNINDEXED,
  lat UNINDEXED,
  lng UNINDEXED,
  tokenize = 'ascii',
  columnsize = 0
);`;

// The whole index again from one archive: the old table goes at once, an old place never stays
// beside new ones, and a dropped table costs no written rows. D1 limits one statement to 100 KB.
const ROWS_PER_INSERT = 250;
const COLUMNS = 'words, cell, name, kind, area, lat, lng';

const text = (value: string | null) => (value === null ? 'NULL' : `'${value.replaceAll("'", "''")}'`);

const values = (place: PlaceRow) =>
  `(${[place.words, place.cell, place.name, place.kind, place.area].map(text).join(', ')}, ${place.point.lat}, ${place.point.lng})`;

export function placeIndexSql(places: readonly PlaceRow[]): string[] {
  const statements = ['DROP TABLE IF EXISTS map_places;', PLACE_INDEX_SCHEMA];
  for (let start = 0; start < places.length; start += ROWS_PER_INSERT) {
    const group = places.slice(start, start + ROWS_PER_INSERT).map(values);
    statements.push(`INSERT INTO map_places (${COLUMNS}) VALUES\n${group.join(',\n')};`);
  }
  return statements;
}
