import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed, request } from './booking-test-kit';
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
    expect(document.querySelector('.outcome-plate-off')?.textContent).toContain('joy bera olmadi');
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

  it('an expired request says so on the same plate, with why', async () => {
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [{ ...request, status: 'expired' as const }] },
        bookings: { myBookings: async () => [], myOffers: async () => [] },
      }),
    );
    // In «Faol» with «Muddati oʻtdi» (G75, docs/158 Е): the card opens the request.
    await tap('Muddati oʻtdi');
    const plate = await vi.waitFor(() => document.querySelector('.outcome-plate-off') as HTMLElement);
    expect(plate.textContent).toContain('Shu kunga haydovchi topilmadi.');
  });
});
