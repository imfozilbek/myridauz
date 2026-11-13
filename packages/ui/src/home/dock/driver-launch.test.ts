import type { Location } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { tripEnds } from './driver-launch';

const place = (id: string, parentId: string | null): Location => ({
  id,
  parentId,
  type: parentId === null ? 'region' : 'district',
  name: id,
  lat: 41,
  lng: 69,
  oneCity: false,
});
const region = place('1710', null);
const yakkabog = place('1710245', '1710');
const chilonzor = place('1726269', '1726');

// Prod errors 13.11.2026: a whole region of the block went to the trip and the price answered
// locations.not_found (66 times in a week). A trip goes between districts or cities (docs/14).
describe('a new trip from the ends of the block of a driver', () => {
  it('keeps districts and cities, asks a whole region again on the route', () => {
    expect(tripEnds(yakkabog, chilonzor)).toEqual({ route: { from: yakkabog, to: chilonzor } });
    expect(tripEnds(region, chilonzor)).toEqual({ to: chilonzor });
    expect(tripEnds(yakkabog, region)).toEqual({ from: yakkabog });
    expect(tripEnds(region, region)).toBeUndefined();
    expect(tripEnds(null, null)).toBeUndefined();
  });
});
