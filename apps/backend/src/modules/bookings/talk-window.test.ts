import { AFTER_TRIP_TALK_HOURS, arrivalAt } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { chatMember } from './application/chat-member';
import { NO_MARKS, type BookingRecord } from './domain/booking';
import { DILNOZA, HOUR, NOW, setup } from './test-kit';

const KM = 300;

async function ride(status: BookingRecord['status'], kit = setup(), extra: { over?: boolean } = {}) {
  const tripId = kit.addTrip({ departAt: NOW, km: KM, ...extra });
  const record: BookingRecord = {
    id: kit.deps.newId(),
    tripId,
    passengerId: DILNOZA,
    seats: 1,
    wholeCar: false,
    withWoman: false,
    price: 90_000,
    commission: 9000,
    status,
    expiresAt: NOW,
    mode: 'door',
    pitakId: null,
    pickup: null,
    pickupNamed: null,
    dropoff: null,
    dropoffNamed: null,
    offerId: null,
    confirmedAt: NOW,
    boardedAt: null,
    arrivedAt: null,
    cameAt: null,
    ...NO_MARKS,
    createdAt: NOW,
    updatedAt: NOW,
  };
  await kit.deps.bookings.save(record);
  const member = () => chatMember(kit.deps, `b${record.id}`, DILNOZA);
  return { kit, member, arrival: arrivalAt(NOW, KM) };
}

describe('chat and call 24 hours after the trip (docs/129, G60)', () => {
  it('a confirmed seat may write and call', async () => {
    const { member } = await ride('confirmed');
    expect(await member()).toMatchObject({ canCall: true, canWrite: true });
  });

  it('a confirmed seat of a trip that is over counts as after the trip', async () => {
    const kit = setup();
    const { member, arrival } = await ride('confirmed', kit, { over: true });
    kit.setNow(arrival + AFTER_TRIP_TALK_HOURS * HOUR);
    expect(await member()).toMatchObject({ canCall: false, canWrite: false });
  });

  it('after the trip: write and call for 24 hours from the arrival, then read only', async () => {
    const { kit, member, arrival } = await ride('completed');
    kit.setNow(arrival + (AFTER_TRIP_TALK_HOURS - 1) * HOUR);
    expect(await member()).toMatchObject({ canCall: true, canWrite: true });
    kit.setNow(arrival + AFTER_TRIP_TALK_HOURS * HOUR);
    expect(await member()).toMatchObject({ canCall: false, canWrite: false });
  });

  it('a cancelled seat may still read and write, never call', async () => {
    const { member } = await ride('cancelled_by_driver');
    expect(await member()).toMatchObject({ canCall: false, canWrite: true });
  });
});
