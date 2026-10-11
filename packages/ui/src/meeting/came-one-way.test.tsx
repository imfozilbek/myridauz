import { loadBrand } from '@platform/brands';
import { MINUTE_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { PASSENGER_ACTIONS } from '../home/home-test-actions';
import { renderHome } from '../home/home-test-kit';
import { PassengerHome } from '../home/passenger-home';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';

// «Men keldim» is one code (G77 C7): the block and the card of the meeting both send it through
// useCame, so it is counted and answered the same way everywhere. Here only who calls it.
const told = vi.hoisted(() => vi.fn());
vi.mock('./use-came', () => ({
  useCame: (_onTold: unknown, screen: string) => ({
    came: (booking: { readonly id: string }) => told(screen, booking.id),
    failure: null,
  }),
}));

afterEach(() => {
  cleanup();
  told.mockClear();
});

const soon = () => Date.now() + (loadBrand().schedule.meetMinutes - 10) * MINUTE_MS;

describe('«Men keldim» of a passenger, one way (G77 C7)', { timeout: 20_000 }, () => {
  it('the block of the main screen sends it through useCame', async () => {
    const departAt = soon();
    const seat = { ...confirmed, trip: { ...trip, departAt, firstDepartAt: departAt } };
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [seat] });
    await tap('Men keldim');
    expect(told).toHaveBeenCalledWith('home', seat.id);
  });

  it('the card of the meeting sends it through useCame', async () => {
    vi.setSystemTime(confirmed.trip.departAt - (loadBrand().schedule.meetMinutes - 10) * MINUTE_MS);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [] },
      }),
    );
    await tap('Jasur');
    await tap('Men keldim');
    expect(told).toHaveBeenCalledWith('bookings.passenger', confirmed.id);
    expect(screen.queryByText('Xatolik yuz berdi')).toBeNull();
  });
});
