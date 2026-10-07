import type { Booking, Offer, Wallet } from '@platform/contracts';
import { trip } from '../market/market-test-kit';

// Test helper for bookings, offers and the wallet: one of each, like the API sends them.
export const booking: Booking = {
  id: 'b1',
  trip,
  passenger: { id: '00000000000000000000000000000009', firstName: 'Dilnoza', hasAvatar: false },
  seats: 2,
  wholeCar: false,
  withWoman: false,
  price: 95000,
  commission: 19000,
  status: 'requested',
  createdAt: Date.parse('2026-10-01T03:00:00Z'),
  expiresAt: Date.parse('2026-10-02T03:00:00Z'),
  mode: 'door',
  pitak: null,
  // Before the confirmation the driver sees the area only (docs/70).
  pickup: { point: null, name: null, area: { step: 'mahalla', name: 'Qatortol' } },
  dropoff: { point: null, name: null, area: { step: 'district', name: 'Samarqand shahri' } },
  extraKm: 2,
  plate: null,
  chatKey: 'b00000000-0000-4000-8000-0000000000b1',
  confirmedAt: null,
  boardedAt: null,
  arrivedAt: null,
};

// The morning of the trip in Toshkent: «Mashinaga chiqdim» is there only on its day (docs/89 P7).
export const TRIP_DAY = Date.parse('2026-10-02T01:00:00Z');

export const confirmed: Booking = {
  ...booking,
  status: 'confirmed',
  confirmedAt: Date.parse('2026-10-01T05:00:00Z'),
  pickup: {
    point: { lat: 41.2856, lng: 69.2045 },
    name: { step: 'landmark', name: 'Chilonzor bozori' },
    area: { step: 'mahalla', name: 'Qatortol' },
  },
  dropoff: {
    point: { lat: 39.6547, lng: 66.9758 },
    name: { step: 'mahalla', name: 'Registon mahallasi' },
    area: { step: 'mahalla', name: 'Registon mahallasi' },
  },
  extraKm: null,
  plate: '01A123BC',
};

export const offer: Offer = {
  id: 'o1',
  requestId: 'r1',
  driver: trip.driver,
  from: trip.from,
  to: trip.to,
  departAt: trip.departAt,
  km: trip.km,
  seats: 2,
  price: 95000,
  commission: 0,
  status: 'sent',
  bookingId: null,
  chatKey: 'o00000000-0000-4000-8000-0000000000c1',
};

export const wallet: Wallet = {
  bonus: 481000,
  main: 0,
  bonusExpiresAt: Date.parse('2026-10-31T00:00:00Z'),
  operations: [
    {
      id: 'w2',
      kind: 'commission',
      balance: 'bonus',
      amount: -19000,
      bookingId: 'b1',
      reason: null,
      createdAt: Date.parse('2026-10-01T04:00:00Z'),
    },
    {
      id: 'w1',
      kind: 'bonus_grant',
      balance: 'bonus',
      amount: 500000,
      bookingId: null,
      reason: null,
      createdAt: Date.parse('2026-10-01T02:00:00Z'),
    },
  ],
};

// A request of the passenger with the offers of drivers (docs/09).
export const request = {
  id: 'r1',
  passenger: { id: '00000000000000000000000000000009', firstName: 'Dilnoza', hasAvatar: false },
  from: '1726269',
  to: '1730401',
  date: '2026-10-02',
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open' as const,
  pickupMode: 'both' as const,
};
