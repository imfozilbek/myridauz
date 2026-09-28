import { describe, expect, it } from 'vitest';
import { cachedDirectory } from './application/directory';
import { getDistance } from './application/distance';
import { roadFactor, roadKm, straightKm } from './domain/distance';
import { createMemoryLocations } from './infrastructure/memory-locations';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };
const SAMARQAND = { lat: 39.6542, lng: 66.9597 };

describe('road distance formula', () => {
  it('measures the straight line between centers', () => {
    expect(Math.round(straightKm(TASHKENT, SAMARQAND))).toBe(269);
    expect(straightKm(TASHKENT, TASHKENT)).toBe(0);
  });

  it('multiplies by the factor of the pair of regions', () => {
    const factors = { default: 1.3, pairs: { '1718-1726': 1.1 } };
    expect(roadFactor(factors, '1726', '1718')).toBe(1.1);
    expect(roadFactor(factors, '1703', '1706')).toBe(1.3);
    expect(roadKm(TASHKENT, SAMARQAND, 1.1)).toBe(296);
    expect(roadKm(TASHKENT, TASHKENT, 1.1)).toBe(1);
  });
});

describe('directory cache', () => {
  it('reads the store once per period', async () => {
    let now = 0;
    const locations = createMemoryLocations();
    const deps = { locations, now: () => now };
    const directory = cachedDirectory(1000);
    await directory(deps, 'uz-Latn');
    await directory(deps, 'uz-Latn');
    expect(locations.reads()).toBe(1);
    now = 1000;
    await directory(deps, 'uz-Latn');
    expect(locations.reads()).toBe(2);
    expect(await getDistance(deps, directory, '1', '2')).toEqual({ ok: false, error: 'locations.not_found' });
  });
});
