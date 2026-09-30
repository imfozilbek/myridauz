import type { Booking, Offer, Wallet } from '@platform/contracts';
import { trip } from '../market/market-test-kit';

// Test helper for bookings, offers and the wallet: one of each, like the API sends them.
export const booking: Booking = {
  id: 'b1',
  trip,
  passenger: { id: '00000000000000000000000000000009', firstName: 'Dilnoza', hasAvatar: false },
  seats: 2,
  price: 95000,
  commission: 19000,
  status: 'requested',
  createdAt: Date.parse('2026-10-01T03:00:00Z'),
  meetingPoint: null,
  pickup: null,
  plate: null,
  chatKey: 'b00000000-0000-4000-8000-0000000000b1',
  boardedAt: null,
  arrivedAt: null,
};

export const confirmed: Booking = {
  ...booking,
  status: 'confirmed',
  meetingPoint: { lat: 41.3, lng: 69.2 },
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
