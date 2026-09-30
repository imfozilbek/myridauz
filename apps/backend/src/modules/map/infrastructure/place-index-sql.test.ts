import { describe, expect, it } from 'vitest';
import { PLACE_INDEX_SCHEMA, placeIndexSql } from './place-index-sql';
import type { PlaceRow } from './place-rows';

const row = (name: string): PlaceRow => ({
  name,
  kind: 'market',
  area: null,
  point: { lat: 41.3, lng: 69.2 },
  words: 'chorsu',
  cell: '165x276',
});

describe('the SQL that fills the search index (G23)', () => {
  it('makes the index again, then adds the places in small groups', () => {
    const sql = placeIndexSql(Array.from({ length: 501 }, (_, index) => row(`Joy ${index}`)));
    expect(sql.slice(0, 2)).toEqual(['DROP TABLE IF EXISTS map_places;', PLACE_INDEX_SCHEMA]);
    expect(sql).toHaveLength(5);
    expect(sql[2]).toContain("('chorsu', '165x276', 'Joy 0', 'market', NULL, 41.3, 69.2)");
  });

  it('keeps quotes in names safe', () => {
    const [, , insert] = placeIndexSql([{ ...row("Oʻzbekiston bo'yi"), area: "Qo'qon" }]);
    expect(insert).toContain("'Oʻzbekiston bo''yi', 'market', 'Qo''qon'");
  });

  // pnpm vitest run -u <this file> rewrites the migration.
  it('has the same table as migrations/0022_map_places.sql', async () => {
    const header = [
      '-- G23 (docs/67): places of the map found by name. pnpm map-data fills it from the same archive as',
      '-- the map and makes it again with each new archive. The same table as PLACE_INDEX_SCHEMA.',
    ];
    await expect([...header, PLACE_INDEX_SCHEMA, ''].join('\n')).toMatchFileSnapshot(
      '../../../../migrations/0022_map_places.sql',
    );
  });
});
