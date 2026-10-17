import type { Location, RideRequest } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { openOn } from './existing-request';

const place = (id: string, parentId: string | null): Location =>
  ({ id, parentId, name: id, type: parentId ? 'district' : 'region', oneCity: false }) as Location;
const PLACES = [place('1726', null), place('1726273', '1726'), place('1718', null), place('1718401', '1718')];
const find = (id: string) => PLACES.find((item) => item.id === id);
const request = { status: 'open', from: '1726273', to: '1718401', date: '2026-10-18' } as RideRequest;

// Lesson 309: a request from «Toshkent shahri» keeps the district of its point (G78 П9); «Mening
// soʻrovim» right after it and the check of the route must still find it.
describe('the open request of a route and day', () => {
  it('is found by its districts and by their whole regions', () => {
    const day = { date: '2026-10-18' };
    expect(openOn({ from: '1726273', to: '1718401', ...day }, find)(request)).toBe(true);
    expect(openOn({ from: '1726', to: '1718', ...day }, find)(request)).toBe(true);
    expect(openOn({ from: '1718', to: '1726', ...day }, find)(request)).toBe(false);
    expect(openOn({ from: '1726', to: '1718', date: '2026-10-19' }, find)(request)).toBe(false);
  });
});
