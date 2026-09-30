import type { PlaceRow } from './place-rows.ts';

// The search index (G23, docs/67): words are the search keys of every spelling, cell the quarter
// degree cell for «near», fine the cell of about 1 km and kind for the name of a point (G24).
// columnsize=0 keeps no sizes of words: a row fewer to write for each place, and D1 counts
// written rows (docs/61). Migration 0023 creates the same table.
export const PLACE_INDEX_SCHEMA = `CREATE VIRTUAL TABLE map_places USING fts5(
  words,
  cell,
  fine,
  kind,
  district UNINDEXED,
  name UNINDEXED,
  area UNINDEXED,
  lat UNINDEXED,
  lng UNINDEXED,
  tokenize = 'ascii',
  columnsize = 0
);`;

// The whole index again from one archive: the old table goes at once, an old place never stays
// beside new ones, and a dropped table costs no written rows. D1 limits one statement to 100 KB.
const ROWS_PER_INSERT = 250;
const COLUMNS = 'words, cell, fine, kind, district, name, area, lat, lng';

const text = (value: string | null) => (value === null ? 'NULL' : `'${value.replaceAll("'", "''")}'`);

const values = (place: PlaceRow) =>
  `(${[place.words, place.cell, place.fine, place.kind, place.district, place.name, place.area].map(text).join(', ')}, ${place.point.lat}, ${place.point.lng})`;

export function placeIndexSql(places: readonly PlaceRow[]): string[] {
  const statements = ['DROP TABLE IF EXISTS map_places;', PLACE_INDEX_SCHEMA];
  for (let start = 0; start < places.length; start += ROWS_PER_INSERT) {
    const group = places.slice(start, start + ROWS_PER_INSERT).map(values);
    statements.push(`INSERT INTO map_places (${COLUMNS}) VALUES\n${group.join(',\n')};`);
  }
  return statements;
}
