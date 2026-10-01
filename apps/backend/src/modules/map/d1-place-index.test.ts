import { beforeEach, describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { nearFineCells } from './domain/place-cell';
import { d1PlaceIndex } from './infrastructure/d1-place-index';
import { placeIndexSql } from './infrastructure/place-index-sql';
import { placeRow } from './test-kit';

// The SQL of the search index on SQLite with FTS5, as D1 runs it (G23, G24).
const CHORSU = { lat: 41.3265, lng: 69.2347 };
let index: ReturnType<typeof d1PlaceIndex>;

beforeEach(async () => {
  const db = testD1();
  const rows = [
    placeRow(
      'Chorsu bozori',
      'market',
      { lat: 41.3266, lng: 69.2348 },
      { words: 'charsu bazari', district: '1726277' },
    ),
    placeRow('Chorsu mahallasi', 'mahalla', { lat: 41.3285, lng: 69.2347 }, { words: 'charsu mahalasi' }),
    placeRow('Chorsu', 'place', { lat: 39.6545, lng: 66.9759 }, { words: 'charsu' }),
  ];
  for (const statement of placeIndexSql(rows)) await db.exec(statement.replaceAll('\n', ' '));
  index = d1PlaceIndex(db);
});

describe('the place index in D1 (G24)', () => {
  it('finds by words near a point, with the district of the place', async () => {
    const found = await index.find({ words: ['charsu'], cells: null, near: CHORSU, districts: null }, 10);
    expect(found.map((place) => place.name)).toEqual(['Chorsu bozori', 'Chorsu mahallasi', 'Chorsu']);
    expect(found[0]?.district).toBe('1726277');
  });

  it('finds only in the districts of a zone (G26)', async () => {
    const found = await index.find(
      { words: ['charsu'], cells: null, near: CHORSU, districts: ['1726277'] },
      10,
    );
    expect(found.map((place) => place.name)).toEqual(['Chorsu bozori']);
  });

  it('finds what lies around a point by the fine cells and the kinds', async () => {
    const cells = { column: 'fine', list: nearFineCells(CHORSU) } as const;
    const markets = await index.around({ cells, kinds: ['market'], near: CHORSU }, 10);
    expect(markets.map((place) => place.name)).toEqual(['Chorsu bozori']);
    const all = await index.around({ cells, kinds: ['market', 'mahalla', 'place'], near: CHORSU }, 10);
    expect(all.map((place) => place.name)).toEqual(['Chorsu bozori', 'Chorsu mahallasi']);
  });
});
