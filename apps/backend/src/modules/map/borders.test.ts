import { describe, expect, it } from 'vitest';
import places from '../../../seed/locations.json' with { type: 'json' };
import { decodeRing, districtAt, holds } from './domain/borders';
import { districtBorders } from './infrastructure/district-borders';

const borders = districtBorders();
const level2 = places.filter((place) => place.parentId !== null);
const regionOf = new Map(places.map((place) => [place.id, place.parentId]));
// A grid over Uzbekistan every 0.05 degree, about 5 km: 58 000 points.
const STEP = 0.05;
const grid = function* () {
  for (let lat = 37.1; lat < 45.6; lat += STEP)
    for (let lng = 55.9; lng < 73.2; lng += STEP) yield { lat, lng };
};

describe('the borders of districts and cities (G24, docs/48)', () => {
  it('has a border for every district and city of the directory and for nothing else', () => {
    expect(borders.map((border) => border.id).sort()).toEqual(level2.map((place) => place.id).sort());
    for (const border of borders) expect(border.parts.length).toBeGreaterThan(0);
  });

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

  it('finds the district of known places by the border, not by the nearest center', () => {
    expect(districtAt(borders, { lat: 41.3265, lng: 69.2347 })).toBe('1726277'); // Chorsu: Shayxontohur
    expect(districtAt(borders, { lat: 39.6547, lng: 66.9758 })).toBe('1718401'); // Registon: Samarqand shahri
    expect(districtAt(borders, { lat: 41.2856, lng: 69.2045 })).toBe('1726294'); // Chilonzor
    expect(districtAt(borders, { lat: 43.2389, lng: 76.8897 })).toBeNull(); // Almaty
  });

  it('puts the center of every place into a border of its own region', () => {
    for (const place of level2) {
      const found = districtAt(borders, place);
      expect(found, place.name).not.toBeNull();
      expect(regionOf.get(found ?? ''), place.name).toBe(place.parentId);
    }
  });

  it('reads polylines with negative steps (the example of the format, read at 1e-4)', () => {
    expect(decodeRing('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      [-1202, 385],
      [-1209.5, 407],
      [-1264.53, 432.52],
    ]);
  });
});
