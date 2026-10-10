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
  callsOff: false,
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
    await tap(/· Soʻrov$/u);
    expect(screen.getAllByText(/4,8/)).toHaveLength(2);
  });

  it('a driver sees the answer deadline and the commission before confirming', async () => {
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [booking], driverOffers: async () => [] },
        wallet: { mine: async () => wallet },
      }),
    );
    await openOwnTrip();
    expect(await screen.findByText(/komissiya 19\s000$/u)).toBeTruthy();
    await tap('Dilnoza');
    expect(screen.getByText(/^Javob berish muddati · /u)).toBeTruthy();
    // The rule about changing seats is the passenger's, not the driver's (G27).
    expect(screen.queryByText(/^Bron qilingach/)).toBeNull();
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
    // On the trip and on the booking the button leads to the top up (G27).
    await tap('Hisobni toʻldirish');
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    expect(answer).not.toHaveBeenCalled();
    // The sheet over the trip closes by «Keyinroq» (G75, mockup g75/4 B).
    await tap('Keyinroq');
    await tap('Dilnoza');
    await tap('Hisobni toʻldirish');
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    expect(answer).not.toHaveBeenCalled();
  });
});
