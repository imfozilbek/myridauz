import { describe, expect, it } from 'vitest';
import { answer, confirm } from './application/answer';
import { eraseOldPoints } from './application/erase';
import { cancelByPassenger } from './application/request';
import { NO_MARKS, type BookingRecord } from './domain/booking';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

const DAY = 24 * HOUR;
const HOME = { lat: 41.2856, lng: 69.2045 };
const NAMED = { name: { step: 'landmark', name: 'Bozor' }, area: null } as const;

async function booked(kit: ReturnType<typeof setup>, status: BookingRecord['status'], tripId: string) {
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
    expiresAt: NOW + 20 * HOUR,
    mode: 'door',
    pitakId: null,
    pickup: HOME,
    pickupNamed: NAMED,
    dropoff: { lat: 39.6547, lng: 66.9758 },
    dropoffNamed: NAMED,
    note: null,
    offerId: null,
    confirmedAt: null,
    boardedAt: null,
    arrivedAt: null,
    cameAt: null,
    ...NO_MARKS,
    createdAt: NOW,
    updatedAt: NOW,
  };
  await kit.deps.bookings.save(record);
  return record.id;
}

const pointsOf = async (kit: ReturnType<typeof setup>, id: string) => {
  const found = await kit.deps.bookings.find(id);
  return [found?.pickup, found?.pickupNamed, found?.dropoff, found?.dropoffNamed];
};
const GONE = [null, null, null, null];

describe('the points of a booking are erased (docs/69, G24)', () => {
  it('at once when the passenger cancels or the driver declines, and kept at the confirmation', async () => {
    const kit = setup();
    const trip = kit.addTrip();
    const cancelled = await booked(kit, 'requested', trip);
    const declined = await booked(kit, 'requested', kit.addTrip());
    const confirmed = await booked(kit, 'requested', kit.addTrip());
    await kit.bonus();
    expect((await cancelByPassenger(kit.deps, DILNOZA, cancelled)).ok).toBe(true);
    expect((await answer(kit.deps, DRIVER, declined, 'decline')).ok).toBe(true);
    expect((await confirm(kit.deps, DRIVER, confirmed)).ok).toBe(true);
    expect(await pointsOf(kit, cancelled)).toEqual(GONE);
    expect(await pointsOf(kit, declined)).toEqual(GONE);
    expect((await pointsOf(kit, confirmed))[0]).toEqual(HOME);
  });

  it('when a request expires without an answer', async () => {
    const kit = setup();
    const id = await booked(kit, 'requested', kit.addTrip());
    await kit.deps.bookings.expireOver(NOW + 21 * HOUR);
    expect(await pointsOf(kit, id)).toEqual(GONE);
  });

  it('30 days after the trip, but not under an open complaint and not before', async () => {
    const kit = setup();
    const old = await booked(kit, 'completed', kit.addTrip({ endsAt: NOW + DAY }));
    const complained = await booked(kit, 'completed', kit.addTrip({ endsAt: NOW + DAY }));
    const recent = await booked(kit, 'completed', kit.addTrip({ endsAt: NOW + 5 * DAY }));
    await eraseOldPoints(kit.deps, NOW + 32 * DAY, new Set([complained]));
    expect(await pointsOf(kit, old)).toEqual(GONE);
    expect((await pointsOf(kit, complained))[0]).toEqual(HOME);
    expect((await pointsOf(kit, recent))[0]).toEqual(HOME);
    // After the decision the complaint is closed: the next run erases them.
    await eraseOldPoints(kit.deps, NOW + 32 * DAY, new Set());
    expect(await pointsOf(kit, complained)).toEqual(GONE);
  });

  it('every point of a person at once at «Maʼlumotlarimni oʻchirish»', async () => {
    const kit = setup();
    const id = await booked(kit, 'confirmed', kit.addTrip());
    await kit.deps.bookings.erasePointsOf(DILNOZA);
    expect(await pointsOf(kit, id)).toEqual(GONE);
    expect((await kit.deps.bookings.find(id))?.status).toBe('confirmed');
  });
});
