import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { createMarketClient } from './market-client';

const options = { baseUrl: 'https://api.test', app: 'driver', initData: 'a=1' } as const;
const ID = '00000000-0000-0000-0000-000000000001';
const DEPART = Date.parse('2026-10-08T03:00:00Z');
const trip = {
  id: ID,
  driver: {
    id: '0123456789abcdef0123456789abcdef',
    firstName: 'Jasur',
    hasAvatar: false,
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC' },
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
  bookingRule: 'seats',
  pitak: null,
  comment: '',
  status: 'active',
  departedAt: DEPART - 600_000,
  arrivedAt: null,
} as const;

describe('«Yoʻlga chiqdim» and «Yetib keldik» of the driver app (G63)', () => {
  it('posts the step of the own trip, signed, and reads the trip back', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json(trip));
    const client = createMarketClient({ ...options, fetch });
    expect(await client.departTrip(ID)).toEqual(trip);
    await client.arriveTrip(ID);
    expect(fetch.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      [`https://api.test/driver/trips/${ID}/depart`, 'POST'],
      [`https://api.test/driver/trips/${ID}/arrive`, 'POST'],
    ]);
  });

  it('fails with the code of the server', async () => {
    const answer = { error: 'trips.too_early_to_depart' };
    const fetch = vi.fn<Fetch>(async () => Response.json(answer, { status: 409 }));
    const failed = createMarketClient({ ...options, fetch }).departTrip(ID);
    await expect(failed).rejects.toEqual(new ApiError(409, 'trips.too_early_to_depart'));
  });
});
