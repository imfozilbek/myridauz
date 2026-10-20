import { describe, expect, it } from 'vitest';
import { districtAt, holds } from './domain/borders';
import { districtBorders } from './infrastructure/district-borders';

// The borders over the whole country (58 000 points): a check of the map data, apart from the
// logic. The mutation run skips this file: under Stryker it takes minutes (vitest.stryker.config.ts).
const borders = districtBorders();
// A grid over Uzbekistan every 0.05 degree, about 5 km: 58 000 points.
const STEP = 0.05;
const grid = function* () {
  for (let lat = 37.1; lat < 45.6; lat += STEP)
    for (let lng = 55.9; lng < 73.2; lng += STEP) yield { lat, lng };
};

describe('the borders of districts and cities over the country (G24, docs/48)', { timeout: 20_000 }, () => {
  it('never puts one point into two borders', () => {
    for (const point of grid())
      expect(borders.filter((border) => holds(border, point)).length).toBeLessThan(2);
  });

  it('covers the country without gaps: the districts add up to the area of Uzbekistan', () => {
    const KM_PER_DEGREE = 111.32;
    let km2 = 0;
    for (const point of grid())
      if (districtAt(borders, point) !== null)
        km2 += (STEP * KM_PER_DEGREE) ** 2 * Math.cos((point.lat * Math.PI) / 180);
    // 448 978 km2, the grid of 5 km counts it within a percent.
    expect(km2).toBeGreaterThan(444_000);
    expect(km2).toBeLessThan(454_000);
  });
});
