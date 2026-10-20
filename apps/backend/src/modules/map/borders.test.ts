import { describe, expect, it } from 'vitest';
import places from '../../../seed/locations.json' with { type: 'json' };
import { decodeRing, districtAt } from './domain/borders';
import { districtBorders } from './infrastructure/district-borders';

const borders = districtBorders();
const level2 = places.filter((place) => place.parentId !== null);
const regionOf = new Map(places.map((place) => [place.id, place.parentId]));

describe('the borders of districts and cities (G24, docs/48)', { timeout: 20_000 }, () => {
  it('has a border for every district and city of the directory and for nothing else', () => {
    expect(borders.map((border) => border.id).sort()).toEqual(level2.map((place) => place.id).sort());
    for (const border of borders) expect(border.parts.length).toBeGreaterThan(0);
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
