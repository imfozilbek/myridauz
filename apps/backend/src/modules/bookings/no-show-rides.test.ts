import { describe, expect, it } from 'vitest';
import { confirm } from './application/answer';
import { markMeeting } from './application/meeting';
import { pastRides } from './application/past';
import { requestBooking } from './application/request';
import { filedRideOf, ratableRideOf, ridesOf } from './application/rides';
import { DEPART, ENDS, MEETING } from './test-booked';
import { ALI, DILNOZA, DRIVER, HOUR, seats, setup } from './test-kit';

// Dilnoza did not come, Ali rode: the trip is over.
async function tripWithNoShow() {
  const kit = setup();
  await kit.bonus();
  const tripId = kit.addTrip();
  const ids: string[] = [];
  for (const passenger of [DILNOZA, ALI]) {
    const asked = await requestBooking(kit.deps, passenger, tripId, seats(1));
    if (!asked.ok) throw new Error('no booking');
    await confirm(kit.deps, DRIVER, asked.value.id);
    ids.push(asked.value.id);
  }
  const [missed = '', rode = ''] = ids;
  kit.setNow(MEETING);
  await markMeeting(kit.deps, DRIVER, missed, 'no_show');
  kit.setNow(ENDS + HOUR);
  return { ...kit, tripId, missed, rode };
}

describe('a passenger who did not come rode nothing (docs/129, G63)', () => {
  it('gets no rating asks and the driver none about them', async () => {
    const { deps, tripId, missed, rode } = await tripWithNoShow();
    const ended = [{ id: tripId, driverId: DRIVER, departAt: DEPART, endsAt: ENDS }];
    expect((await ridesOf(deps, ended)).map((ride) => ride.bookingId)).toEqual([rode]);
    expect(await ratableRideOf(deps, missed)).toBeUndefined();
    expect((await ratableRideOf(deps, rode))?.bookingId).toBe(rode);
  });

  it('is not in «Safarlar tarixi» of either side', async () => {
    const kit = await tripWithNoShow();
    const over = { ...kit.deps, trips: { ...kit.deps.trips, find: overTrip(kit.deps) } };
    expect(await pastRides(over, DILNOZA, 'passenger')).toEqual([]);
    expect((await pastRides(over, DRIVER, 'driver')).map((ride) => ride.bookingId)).toEqual([kit.rode]);
  });

  it('still leaves the ride for the complaint and its decision', async () => {
    const { deps, missed } = await tripWithNoShow();
    expect((await filedRideOf(deps, missed))?.commission).toBe(9000);
  });
});

// The fake trips do not end by themselves: this one reads as over.
const overTrip = (deps: Parameters<typeof pastRides>[0]) => async (id: string) => {
  const trip = await deps.trips.find(id);
  return trip && { ...trip, over: true };
};
