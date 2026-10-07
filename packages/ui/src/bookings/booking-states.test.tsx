import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';
import type { Booking } from '@platform/contracts';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const open = (booking: Booking) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [booking], myOffers: async () => [] },
    }),
  );

describe('the states of a booking page (docs/124 А, Б)', () => {
  it('a refused seat says why and leads to the trips of the same route', async () => {
    vi.setSystemTime(confirmed.trip.departAt - 5 * HOUR);
    open({ ...confirmed, status: 'declined', plate: null });
    await tap('Oʻtgan');
    await tap(/^Jasur/u);
    expect(screen.getByText('Haydovchi joy bera olmadi.')).toBeTruthy();
    await tap('Oʻxshash safarlar');
    expect(screen.queryByText('Haydovchi joy bera olmadi.')).toBeNull();
  });

  it('a moved trip shows the old and the new time and a free «Rozi emasman»', async () => {
    vi.setSystemTime(confirmed.trip.departAt - 5 * HOUR);
    const trip = { ...confirmed.trip, firstDepartAt: confirmed.trip.departAt - HOUR };
    open({ ...confirmed, trip });
    await tap('Jasur');
    expect(screen.getByText(/^Vaqt oʻzgardi: \d{2}:\d{2} → \d{2}:\d{2}$/u)).toBeTruthy();
    expect(screen.getByText('Rozi emasman')).toBeTruthy();
  });
});
