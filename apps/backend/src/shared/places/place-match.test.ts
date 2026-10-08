import { describe, expect, it } from 'vitest';
import { placeMatches, placesMatching, regionIn } from './place-match';

const place = (id: string, parentId: string | null, oneCity = false) =>
  [id, { id, parentId, oneCity }] as const;
const PLACES = new Map([
  place('1726', null, true),
  place('1726273', '1726'),
  place('1726294', '1726'),
  place('1718', null),
  place('1718401', '1718'),
  place('1718406', '1718'),
]);

// The database reads the trips of exactly the places that fit the search (G56).
describe('the places of a search', () => {
  it('are the same places placeMatches lets through', () => {
    for (const search of PLACES.keys()) {
      const fits = [...PLACES.keys()].filter((id) => placeMatches(id, search, PLACES));
      expect(placesMatching(search, PLACES).sort()).toEqual(fits.sort());
    }
    expect(placesMatching('1718', PLACES)).toEqual(['1718', '1718401', '1718406']);
    expect(placesMatching('1718401', PLACES)).toEqual(['1718401']);
    expect(placesMatching('1726273', PLACES)).toEqual(['1726273', '1726294']);
  });
});

describe('the region of a place (docs/14)', () => {
  it('is the parent of a district and the region itself', () => {
    const regionOf = regionIn(PLACES);
    expect(regionOf('1726273')).toBe('1726');
    expect(regionOf('1718')).toBe('1718');
    // An unknown id stands for itself: the pitak of the direction is simply not found.
    expect(regionOf('9999')).toBe('9999');
  });
});
