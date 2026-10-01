import type { FoundPlace } from '@platform/contracts';
import { describe, expect, it, vi } from 'vitest';
import { memoryPlaceIndex } from './infrastructure/memory-place-index';
import { searchPlaces } from './application/search-places';
import { placeRow } from './test-kit';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };
const place = (name: string, words: string, lat: number, lng: number) =>
  placeRow(name, 'market', { lat, lng }, { words });
const chorsu = place('Chorsu bozori', 'charsu bazari', 41.3265, 69.2355);
const farChorsu = place('Chorsu', 'charsu', 39.65, 66.96);
const names = (places: readonly FoundPlace[]) => places.map((found) => found.name);

describe('the search of places by name (G23, docs/67)', () => {
  it('finds a place by the start of its words in any spelling', async () => {
    const index = memoryPlaceIndex([chorsu]);
    expect(names(await searchPlaces(index, 'Чорсу', TASHKENT, null))).toEqual(['Chorsu bozori']);
    expect(names(await searchPlaces(index, 'chors boz', TASHKENT, null))).toEqual(['Chorsu bozori']);
    expect(await searchPlaces(index, 'Chorsu bozori yoni', TASHKENT, null)).toEqual([]);
  });

  it('puts the places near the start of the trip first, then the far ones', async () => {
    const found = await searchPlaces(memoryPlaceIndex([farChorsu, chorsu]), 'chorsu', TASHKENT, null);
    expect(names(found)).toEqual(['Chorsu bozori', 'Chorsu']);
  });

  it('asks only near when there are enough places near', async () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      place(`${index + 1}-maktab`, `${index + 1} maktab`, 41.3 + index / 1000, 69.28),
    );
    const index = memoryPlaceIndex([farChorsu, ...many]);
    const find = vi.spyOn(index, 'find');
    const found = await searchPlaces(index, 'maktab', TASHKENT, null);
    expect(found).toHaveLength(10);
    expect(found[0]?.name).toBe('12-maktab');
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('orders by the shorter name when the start is unknown', async () => {
    const found = await searchPlaces(memoryPlaceIndex([chorsu, farChorsu]), 'chorsu', null, null);
    expect(names(found)).toEqual(['Chorsu', 'Chorsu bozori']);
  });

  it('takes the nearest of many near places, not the first ones found', async () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      place(`${index + 1}-maktab`, `${index + 1} maktab`, 41.2 + index / 200, 69.28),
    );
    const found = await searchPlaces(memoryPlaceIndex(many), 'maktab', TASHKENT, null);
    expect(found[0]?.name).toBe('23-maktab');
  });

  it('does not search for fewer than two letters', async () => {
    const index = memoryPlaceIndex([chorsu]);
    expect(await searchPlaces(index, 'c', TASHKENT, null)).toEqual([]);
    expect(await searchPlaces(index, ' - ', TASHKENT, null)).toEqual([]);
  });
});
