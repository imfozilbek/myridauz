-- G23 (docs/67): places of the map found by name. pnpm map-data fills it from the same archive as
-- the map and makes it again with each new archive. The same table as PLACE_INDEX_SCHEMA.
CREATE VIRTUAL TABLE map_places USING fts5(
  words,
  cell,
  name UNINDEXED,
  kind UNINDEXED,
  area UNINDEXED,
  lat UNINDEXED,
  lng UNINDEXED,
  tokenize = 'ascii',
  columnsize = 0
);
