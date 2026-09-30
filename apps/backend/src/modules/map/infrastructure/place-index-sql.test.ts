import { describe, expect, it } from 'vitest';
import { PLACE_INDEX_SCHEMA, placeIndexSql } from './place-index-sql';
import type { PlaceRow } from './place-rows';

const row = (name: string): PlaceRow => ({
  name,
  kind: 'market',
  district: null,
  area: null,
  point: { lat: 41.3, lng: 69.2 },
  words: 'chorsu',
  cell: '165x276',
  fine: '4130x6920',
});

describe('the SQL that fills the search index (G23)', () => {
  it('makes the index again, then adds the places in small groups', () => {
    const sql = placeIndexSql(Array.from({ length: 501 }, (_, index) => row(`Joy ${index}`)));
    expect(sql.slice(0, 2)).toEqual(['DROP TABLE IF EXISTS map_places;', PLACE_INDEX_SCHEMA]);
    expect(sql).toHaveLength(5);
    expect(sql[2]).toContain("('chorsu', '165x276', '4130x6920', 'market', NULL, 'Joy 0', NULL, 41.3, 69.2)");
  });

  it('keeps quotes in names safe', () => {
    const [, , insert] = placeIndexSql([{ ...row("Oʻzbekiston bo'yi"), area: "Qo'qon" }]);
    expect(insert).toContain("'market', NULL, 'Oʻzbekiston bo''yi', 'Qo''qon'");
  });

  // pnpm vitest run -u <this file> rewrites the migration.
  it('has the same table as migrations/0023_map_places_district.sql', async () => {
    const header = [
      '-- G24 (docs/69): the index of places gets the district, the cell of about 1 km and the kind for',
      '-- the name of a point. Empty until pnpm map-data fills it again. The same table as PLACE_INDEX_SCHEMA.',
      'DROP TABLE IF EXISTS map_places;',
    ];
    await expect([...header, PLACE_INDEX_SCHEMA, ''].join('\n')).toMatchFileSnapshot(
      '../../../../migrations/0023_map_places_district.sql',
    );
  });
});
