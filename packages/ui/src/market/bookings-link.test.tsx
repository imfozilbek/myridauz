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
const booked = { ...confirmed, id: BOOKING_ID };

describe('a bot button opens its booking (docs/65 B5)', () => {
  it('opens the passenger booking from "?booking=", back goes to the main screen', async () => {
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
    expect(await screen.findByText('01 A 123 BC')).toBeTruthy();
    await tap('Orqaga');
    await tap('Orqaga');
    expect(await screen.findByText('main screen')).toBeTruthy();
    expect(window.location.search).toBe('');
  });

  it('opens a new offer itself from "?offer=" (G40, docs/106 K6)', async () => {
    const OFFER_ID = '0000000c-0000-4000-8000-000000000001';
    window.history.replaceState(null, '', `/?offer=${OFFER_ID}`);
    const request = {
      id: offer.requestId,
      passenger: booked.passenger,
      from: '1726269',
      to: '1730401',
      date: '2026-10-02',
      km: 320,
      seats: 2,
      price: 95000,
      status: 'open' as const,
      pickupMode: 'both' as const,
    };
    renderMarket(
      <BookingsLink app="passenger">
        <p>main screen</p>
      </BookingsLink>,
      testClients({
        market: { myRequests: async () => [request] },
        bookings: { myBookings: async () => [], myOffers: async () => [{ ...offer, id: OFFER_ID }] },
      }),
    );
    expect(await screen.findByText('Qabul qilish')).toBeTruthy();
  });
});
