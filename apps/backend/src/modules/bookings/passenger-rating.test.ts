import { describe, expect, it } from 'vitest';
import { driverBookings } from './application/answer';
import { passengerBookings, requestBooking } from './application/request';
import { DILNOZA, DRIVER, seats, setup } from './test-kit';

const RATED = { average: 4.8, count: 12 };

describe('the rating of a passenger on «Mening safarim» (mockup g63/3)', () => {
  it('goes to the driver who answers the request, not back to the passenger', async () => {
    const { deps, addTrip } = setup();
    const asked: (readonly number[])[] = [];
    const rated = {
      ...deps,
      ratings: async (ids: readonly number[]) => (asked.push(ids), new Map([[DILNOZA, RATED]])),
    };
    await requestBooking(rated, DILNOZA, addTrip(), seats(2));
    const [waiting] = await driverBookings(rated, DRIVER);
    expect(waiting?.passenger.rating).toEqual(RATED);
    // One question for all the passengers of the list, each once.
    expect(asked.at(-1)).toEqual([DILNOZA]);
    const [mine] = await passengerBookings(rated, DILNOZA);
    expect(mine?.passenger.rating).toBeUndefined();
  });

  it('is «new» for a passenger without ratings yet', async () => {
    const { deps, addTrip } = setup();
    await requestBooking(deps, DILNOZA, addTrip(), seats(1));
    const [waiting] = await driverBookings(deps, DRIVER);
    expect(waiting?.passenger.rating).toEqual({ average: null, count: 0 });
  });
});
