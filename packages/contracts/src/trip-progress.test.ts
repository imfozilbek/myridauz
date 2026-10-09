import { describe, expect, it } from 'vitest';
import { DEPART_EARLY_MS, DEPART_REMIND_MS, onTheWay, tripArrivePath, tripDepartPath } from './trip-progress';
import { tripSchema } from './trips';

const HOUR = 60 * 60 * 1000;
const DEPART = Date.parse('2026-10-08T03:00:00Z');

describe('the driver on the road (G63, docs/35)', () => {
  it('counts a trip on the road from «Yoʻlga chiqdim» or from its time', () => {
    expect(onTheWay({ departAt: DEPART, departedAt: null }, DEPART - 1)).toBe(false);
    expect(onTheWay({ departAt: DEPART, departedAt: DEPART - HOUR / 2 }, DEPART - 1)).toBe(true);
    expect(onTheWay({ departAt: DEPART, departedAt: null }, DEPART)).toBe(true);
  });

  it('opens the button an hour before and reminds an hour after (the brand departs it later)', () => {
    expect([DEPART_EARLY_MS, DEPART_REMIND_MS]).toEqual([HOUR, HOUR]);
    expect(tripDepartPath('t1')).toBe('/driver/trips/t1/depart');
    expect(tripArrivePath('t1')).toBe('/driver/trips/t1/arrive');
  });

  it('reads an answer of the server before the deploy: no departure and no arrival yet', () => {
    const old = {
      id: 't1',
      driver: {
        id: '0123456789abcdef0123456789abcdef',
        firstName: 'Jasur',
        hasAvatar: false,
        car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' },
        rating: { average: null, count: 0 },
      },
      from: '1726273',
      to: '1718401',
      departAt: DEPART,
      km: 300,
      seats: 3,
      seatsLeft: 3,
      price: 90000,
      firstDepartAt: DEPART,
      firstPrice: 90000,
      recommendedPrice: null,
      woman: false,
      pickupMode: 'door',
      pitak: null,
      comment: '',
      status: 'active',
    };
    expect(tripSchema.parse(old)).toMatchObject({ departedAt: null, arrivedAt: null });
    expect(tripSchema.parse({ ...old, departedAt: DEPART, arrivedAt: null }).departedAt).toBe(DEPART);
  });
});
