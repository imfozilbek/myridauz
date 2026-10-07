import type { TripInput } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { acceptOffer } from './application/accept';
import { passengerOffers, sendOffer } from './application/offers';
import { passengerBookings } from './application/request';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

const offer = { departAt: NOW + 26 * HOUR, price: 90_000 };

// The marks of a request go into the trip and the booking of the accepted offer (G61, docs/118 path 4).
async function accepted(marks: { wholeCar?: boolean; withWoman?: boolean }) {
  const { deps, addRequest, bonus } = setup();
  const published: Required<TripInput>[] = [];
  const publish = deps.trips.publish;
  deps.trips.publish = (driverId, input) => {
    published.push(input);
    return publish(driverId, input);
  };
  await bonus();
  const sent = await sendOffer(deps, DRIVER, addRequest(marks), offer);
  const [shown] = await passengerOffers(deps, DILNOZA);
  await acceptOffer(deps, DILNOZA, sent.ok ? sent.value.id : '');
  const [booking] = await passengerBookings(deps, DILNOZA);
  return { shown, booking, trip: published[0] };
}

describe('an offer on a request with marks (G61)', () => {
  it('«Boʻsh salon kerak»: the offer and the booking take every seat of the car, nobody else books', async () => {
    const { shown, booking, trip } = await accepted({ wholeCar: true });
    // The car has 4 seats: the whole car is 4 × the price of a seat (docs/09).
    expect(shown).toMatchObject({ seats: 4, wholeCar: true, commission: 36_000 });
    expect(trip?.bookingRule).toBe('car_only');
    expect(booking).toMatchObject({ seats: 4, wholeCar: true, trip: { seatsLeft: 0 } });
  });

  it('«Men bilan ayol bor»: the booking keeps it, the trip gets the mark (docs/06 rule 4)', async () => {
    const { shown, booking, trip } = await accepted({ withWoman: true });
    expect(shown).toMatchObject({ seats: 2, wholeCar: false });
    expect(trip?.bookingRule).toBe('seats');
    expect(booking).toMatchObject({ seats: 2, withWoman: true, wholeCar: false });
  });
});
