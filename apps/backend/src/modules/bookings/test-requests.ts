// Test helper: a passenger's request as the bookings module and drivers see it (docs/35, G64).
import { NO_RATING, type RideRequest } from '@platform/contracts';
import type { RequestFacts } from './application/request-facts';
import { AWAY, DILNOZA, HOME } from './test-fakes';
import { publicIdOf } from '../../test-people';

// A request of Dilnoza for 2 people on the next day (docs/35).
export const fakeRequest = (id: string): RequestFacts => ({
  id,
  passengerId: DILNOZA,
  from: '1726273',
  to: '1718401',
  date: '2026-10-02',
  km: 300,
  seats: 2,
  price: 90_000,
  wholeCar: false,
  withWoman: false,
  pickupMode: 'both',
  pickup: HOME,
  dropoff: AWAY,
  open: true,
  status: 'open',
  callsOff: false,
});

// A request as drivers see it (G64): only what the talk shows on top.
export const fakeRequestView = (facts: RequestFacts | undefined): RideRequest | undefined =>
  facts && {
    ...facts,
    passenger: {
      id: publicIdOf(facts.passengerId),
      firstName: 'Dilnoza',
      hasAvatar: false,
      rating: NO_RATING,
    },
    status: facts.open ? 'open' : 'matched',
    views: 0,
  };
