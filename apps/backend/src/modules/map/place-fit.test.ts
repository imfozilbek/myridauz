import { describe, expect, it } from 'vitest';
import { pointFits } from './infrastructure/district-names';

// The zone of a booking (G26, docs/74): the map of a booking is cut by it, the server checks the
// same: the district of the trip, or the whole city of Toshkent.
const CHORSU = { lat: 41.3265, lng: 69.2355 };
const URGUT = { lat: 39.4021, lng: 67.2431 };

describe('the zone of a point of a booking', () => {
  it('takes any district of Toshkent shahri for a trip from one of them', () => {
    expect(pointFits(CHORSU, '1726277', '1726269')).toBe(true);
  });

  it('refuses a far district of another region', () => {
    expect(pointFits(URGUT, '1718224', '1726269')).toBe(false);
    expect(pointFits(CHORSU, null, '1726269')).toBe(false);
  });
});
