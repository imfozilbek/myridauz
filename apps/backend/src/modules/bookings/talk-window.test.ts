import { loadBrand } from '@platform/brands';
import { arrivalAt, DAY_MS, tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { chatMember } from './application/chat-member';
import { openTalk } from './application/talks';
import { NO_MARKS, type BookingRecord } from './domain/booking';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

const KM = 300;
const TALK_HOURS = loadBrand().chat.afterTripHours;

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
    note: null,
    offerId: null,
    talkId: null,
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
    kit.setNow(arrival + TALK_HOURS * HOUR);
    expect(await member()).toMatchObject({ canCall: false, canWrite: false });
  });

  it('after the trip: write and call for 24 hours from the arrival, then read only', async () => {
    const { kit, member, arrival } = await ride('completed');
    kit.setNow(arrival + (TALK_HOURS - 1) * HOUR);
    expect(await member()).toMatchObject({ canCall: true, canWrite: true });
    kit.setNow(arrival + TALK_HOURS * HOUR);
    expect(await member()).toMatchObject({ canCall: false, canWrite: false });
  });

  it('a cancelled seat may still read and write, never call', async () => {
    const { member } = await ride('cancelled_by_driver');
    expect(await member()).toMatchObject({ canCall: false, canWrite: true });
  });

  // G89 B11 (owner decision 20.10.2026): a seat that will not ride keeps the chat a day more, as
  // after a ride, then read only: the pair does not move past Rida (docs/83 N26).
  it.each(['cancelled_by_driver', 'cancelled_by_passenger', 'declined', 'expired'] as const)(
    'a %s seat writes 24 hours from its end, then reads only',
    async (status) => {
      const { kit, member } = await ride(status);
      kit.setNow(NOW + (TALK_HOURS - 1) * HOUR);
      expect(await member()).toMatchObject({ canCall: false, canWrite: true });
      kit.setNow(NOW + TALK_HOURS * HOUR);
      expect(await member()).toMatchObject({ canCall: false, canWrite: false });
    },
  );

  it('a waiting seat that burned writes 24 hours from the time to answer', async () => {
    const { kit, member } = await ride('requested');
    kit.setNow(NOW + (TALK_HOURS - 1) * HOUR);
    expect(await member()).toMatchObject({ canWrite: true });
    kit.setNow(NOW + TALK_HOURS * HOUR);
    expect(await member()).toMatchObject({ canWrite: false });
  });

  it('a talk whose request closed writes until a day after the day of the request', async () => {
    const kit = setup();
    const requestId = kit.addRequest();
    const opened = await openTalk(kit.deps, DRIVER, requestId);
    if (!opened.ok) throw new Error(opened.error);
    const member = () => chatMember(kit.deps, opened.value.chatKey, DILNOZA);
    kit.close(requestId);
    // The request is of 2026-10-02: its day ends at the start of 2026-10-03 in Tashkent.
    const closes = tashkentDayStart('2026-10-02') + DAY_MS + TALK_HOURS * HOUR;
    kit.setNow(closes - HOUR);
    expect(await member()).toMatchObject({ canWrite: true });
    kit.setNow(closes);
    expect(await member()).toMatchObject({ canWrite: false });
  });
});
