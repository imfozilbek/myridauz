import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip, openOwnTrip } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';
import { booking, offer, wallet } from './booking-test-kit';

afterEach(cleanup);

const request = {
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
  wholeCar: false,
  withWoman: false,
};

describe('what people need to decide is on the screen (docs/65 C)', () => {
  it('a passenger sees how many offers came and the rating of each driver', async () => {
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [request] },
        bookings: {
          myBookings: async () => [],
          myOffers: async () => [offer, { ...offer, id: 'o2' }],
        },
      }),
    );
    expect(await screen.findByText('2 ta taklif')).toBeTruthy();
    await tap('bir joy uchun');
    expect(screen.getAllByText(/4,8/)).toHaveLength(2);
  });

  it('a driver sees the answer deadline and the balance before confirming', async () => {
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [booking], driverOffers: async () => [] },
        wallet: { mine: async () => wallet },
      }),
    );
    await openOwnTrip();
    await tap('Dilnoza');
    expect(screen.getByText('Javob berish muddati')).toBeTruthy();
    // The rule about changing seats is the passenger's, not the driver's (G27).
    expect(screen.queryByText(/^Bron qilingach/)).toBeNull();
    await tap('Tasdiqlash');
    expect(await screen.findByText(/Hamyoningizda: 481\s000/)).toBeTruthy();
  });

  it('a driver without the commission is led to top up, not to a «Tasdiqlash» that fails (G27)', async () => {
    const answer = vi.fn(async () => booking);
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [booking], driverOffers: async () => [], answer },
        wallet: { mine: async () => ({ ...wallet, bonus: 0, main: 0 }) },
      }),
    );
    await openOwnTrip();
    await tap('Dilnoza');
    await tap('Tasdiqlash');
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    expect(screen.getByText('Hisobni toʻldirish')).toBeTruthy();
    expect(answer).not.toHaveBeenCalled();
  });
});
