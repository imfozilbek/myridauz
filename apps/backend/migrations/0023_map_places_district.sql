-- G24 (docs/69): the index of places gets the district, the cell of about 1 km and the kind for
-- the name of a point. Empty until pnpm map-data fills it again. The same table as PLACE_INDEX_SCHEMA.
DROP TABLE IF EXISTS map_places;
CREATE VIRTUAL TABLE map_places USING fts5(
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
);
