import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { peopleRows } from '../../test-people';
import type { OfferRecord } from './domain/offer';
import { d1Offers } from './infrastructure/d1-offers';

const CAR = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC' } as const;
const offer = (id: string, driverId: number, status: OfferRecord['status']): OfferRecord => ({
  id,
  requestId: 'r1',
  driverId,
  departAt: 1000,
  price: 90000,
  seats: null,
  car: CAR,
  status,
  bookingId: null,
  talkId: null,
  tripId: null,
  createdAt: 10,
});

// G95 (docs/224): the car the team fixed by its photo reaches the offers still waiting.
describe('the fixed car in the offers of the driver in D1', () => {
  it('changes the waiting offers of the driver only', async () => {
    const db = testD1();
    await db.exec(`${peopleRows([1, 2])}
INSERT INTO ride_requests (id, passenger_id, from_id, to_id, date, expires_at, km, seats, price, status, created_at)
  VALUES ('r1', 2, '1726', '1718', '2026-01-01', 0, 300, 1, 100000, 'open', 0);`);
    const offers = d1Offers(db);
    await offers.save(offer('o1', 1, 'sent'));
    await offers.save(offer('o2', 1, 'declined'));
    await offers.save(offer('o3', 2, 'sent'));
    await offers.fixCar(1, { ...CAR, plate: '01A777BC', color: 'black' });
    const plates = async (id: string) => (await offers.find(id))?.car;
    expect(await plates('o1')).toEqual({ ...CAR, plate: '01A777BC', color: 'black' });
    expect(await plates('o2')).toEqual(CAR);
    expect(await plates('o3')).toEqual(CAR);
  });
});
