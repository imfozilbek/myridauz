import { describe, expect, it } from 'vitest';
import { extraKm, insertionKm, kmBetween, nearestOrder } from './route-math';

// Tashkent: Chorsu, Chilonzor 9, Yunusobod; Samarkand: Registon.
const CHORSU = { lat: 41.3265, lng: 69.2347 };
const CHILONZOR = { lat: 41.2856, lng: 69.2045 };
const YUNUSOBOD = { lat: 41.3634, lng: 69.2873 };
const REGISTON = { lat: 39.6547, lng: 66.9758 };

describe('the extra way of a passenger (G24, docs/70)', () => {
  it('measures straight lines on the Earth', () => {
    expect(Math.round(kmBetween(CHORSU, REGISTON))).toBe(267);
    expect(kmBetween(CHORSU, CHORSU)).toBe(0);
  });

  it('puts a point into the cheapest place of a path', () => {
    expect(insertionKm([], CHORSU)).toBe(0);
    const between = insertionKm([CHILONZOR, YUNUSOBOD], CHORSU);
    expect(between).toBeLessThan(kmBetween(YUNUSOBOD, CHORSU));
    expect(insertionKm([CHORSU], CHORSU)).toBe(0);
  });

  it('adds nothing for a pitak pickup or an empty trip, and a road factor for the rest', () => {
    const empty = { pickups: [], dropoffs: [] };
    expect(extraKm(empty, { pickup: CHORSU, dropoff: REGISTON })).toBe(0);
    const trip = { pickups: [CHILONZOR], dropoffs: [REGISTON] };
    expect(extraKm(trip, { pickup: null, dropoff: REGISTON })).toBe(0);
    expect(extraKm(trip, { pickup: YUNUSOBOD, dropoff: REGISTON })).toBe(
      Math.round(kmBetween(CHILONZOR, YUNUSOBOD) * 1.3),
    );
  });

  it('orders stops from where the driver stands to the nearest next one', () => {
    const stops = [YUNUSOBOD, CHILONZOR, CHORSU].map((point, index) => ({ id: index, point }));
    expect(nearestOrder(CHILONZOR, stops).map((stop) => stop.id)).toEqual([1, 2, 0]);
  });
});
