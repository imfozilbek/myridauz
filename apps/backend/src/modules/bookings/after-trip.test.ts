import { describe, expect, it } from 'vitest';
import { passengerBookings } from './application/request';
import { bookingViews } from './application/views';
import { NO_MARKS, type BookingRecord } from './domain/booking';
import { DILNOZA, HOUR, NOW, setup } from './test-kit';

const NAMED = {
  name: { step: 'landmark', name: 'Bozor' },
  area: { step: 'mahalla', name: 'Qatortol' },
} as const;

function record(kit: ReturnType<typeof setup>, status: BookingRecord['status']): BookingRecord {
  return {
    id: kit.deps.newId(),
    tripId: kit.addTrip(),
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
    pickup: { lat: 41.2856, lng: 69.2045 },
    pickupNamed: NAMED,
    dropoff: { lat: 39.6547, lng: 66.9758 },
    dropoffNamed: NAMED,
    offerId: null,
    confirmedAt: NOW,
    boardedAt: null,
    arrivedAt: null,
    cameAt: null,
    ...NO_MARKS,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe('contacts after the trip (docs/129 «Контакты после поездки», G60)', () => {
  it('a confirmed seat shows the plate and the exact points', async () => {
    const kit = setup();
    const [view] = await bookingViews(kit.deps, [record(kit, 'confirmed')], 'passenger');
    expect(view?.plate).toBe('01A123BC');
    expect(view?.pickup?.point).not.toBeNull();
  });

  it('after the trip the plate and the exact points go; the area stays', async () => {
    const kit = setup();
    for (const viewer of ['passenger', 'driver'] as const) {
      const [view] = await bookingViews(kit.deps, [record(kit, 'completed')], viewer);
      expect(view?.plate).toBeNull();
      expect(view?.pickup?.point).toBeNull();
      expect(view?.pickup?.name).toBeNull();
      expect(view?.pickup?.area?.name).toBe('Qatortol');
    }
  });
});

describe('«Baho berildi» in «Oʻtgan» (G60, mockup g60/6)', () => {
  it('the passenger sees which past seats are rated already', async () => {
    const kit = setup();
    const rated = record(kit, 'completed');
    const other = record(kit, 'completed');
    await kit.deps.bookings.save(rated);
    await kit.deps.bookings.save(other);
    const deps = { ...kit.deps, rated: async () => new Set([rated.id]) };
    const views = await passengerBookings(deps, DILNOZA);
    expect(views.find((view) => view.id === rated.id)?.rated).toBe(true);
    expect(views.find((view) => view.id === other.id)?.rated).toBe(false);
  });
});
