import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { confirmed, offer } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { BookingsLink } from './bookings-link';
import { renderMarket, tap } from './market-test-kit';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const BOOKING_ID = '0000000b-0000-4000-8000-000000000001';
const TRIP = { ...confirmed.trip, id: '0000000a-0000-4000-8000-000000000001' };
const booked = { ...confirmed, id: BOOKING_ID, trip: TRIP };
const REQUEST = {
  id: '0000000d-0000-4000-8000-000000000001',
  passenger: booked.passenger,
  from: '1726269',
  to: '1730401',
  date: '2026-10-02',
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open' as const,
  pickupMode: 'both' as const,
  wholeCar: false,
  withWoman: false,
  callsOff: false,
  views: 0,
};

describe('a bot button opens its booking (docs/65 B5)', () => {
  it('opens the passenger booking from "?booking=", back goes to the main screen in one tap', async () => {
    window.history.replaceState(null, '', `/?booking=${BOOKING_ID}`);
    renderMarket(
      <BookingsLink app="passenger">
        <p>main screen</p>
      </BookingsLink>,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [booked], myOffers: async () => [] },
      }),
    );
    expect(await screen.findByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    // One tap: what a bot or the block opened goes straight home (G77, owner decision 11.10.2026).
    await tap('Orqaga');
    expect(await screen.findByText('main screen')).toBeTruthy();
    expect(window.location.search).toBe('');
  });

  it('the passenger app has no "?offer=": a new offer rings with its sheet (G77)', async () => {
    window.history.replaceState(null, '', '/?offer=0000000c-0000-4000-8000-000000000001');
    renderMarket(
      <BookingsLink app="passenger">
        <p>main screen</p>
      </BookingsLink>,
      testClients({ bookings: { myOffers: async () => [offer] } }),
    );
    expect(await screen.findByText('main screen')).toBeTruthy();
  });

  it('opens the trip of the driver from "?mytrip=", back goes to the main screen in one tap', async () => {
    window.history.replaceState(null, '', `/?mytrip=${TRIP.id}`);
    renderMarket(
      <BookingsLink app="driver">
        <p>main screen</p>
      </BookingsLink>,
      testClients({
        market: { myTrips: async () => [TRIP] },
        bookings: { driverBookings: async () => [booked], driverOffers: async () => [] },
      }),
    );
    expect(await screen.findByText(/^Yoʻlovchilar \(/u)).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('main screen')).toBeTruthy();
    expect(window.location.search).toBe('');
  });

  it('opens «Mening soʻrovim» from "?request=" under the card of a request (G61)', async () => {
    window.history.replaceState(null, '', `/?request=${REQUEST.id}`);
    renderMarket(
      <BookingsLink app="passenger">
        <p>main screen</p>
      </BookingsLink>,
      testClients({
        market: { myRequests: async () => [REQUEST] },
        bookings: { myBookings: async () => [], myOffers: async () => [] },
      }),
    );
    expect(await screen.findByText('Soʻrovni bekor qilish')).toBeTruthy();
    expect(screen.queryByText('main screen')).toBeNull();
    await tap('Orqaga');
    expect(await screen.findByText('main screen')).toBeTruthy();
  });
});
