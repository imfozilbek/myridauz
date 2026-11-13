import { describe, expect, it } from 'vitest';
import { locations, ROUTE } from '../../market/market-test-kit';
import { buildDirectory } from '../../places/directory';
import { countable } from './passenger-idle';

// Prod errors 13.11.2026: «Bugun N, ertaga M» asked the trips of two places of one city (422).
describe('the trips counted under «Qayerga» of a passenger', () => {
  it('counts a route a trip may take, never one inside a city or before the places come', async () => {
    const all = (await locations.getLocations()).locations;
    const directory = buildDirectory(all);
    const city = directory.find('1726');
    expect(countable(ROUTE.from, ROUTE.to, directory)).toBe(true);
    expect(city ? countable(ROUTE.from, city, directory) : null).toBe(false);
    expect(countable(ROUTE.from, ROUTE.to, null)).toBe(false);
  });
});
