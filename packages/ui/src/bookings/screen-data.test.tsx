import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket, tap, trip } from '../market/market-test-kit';
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
    await tap('Dilnoza');
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
    await tap('Jasur');
    await tap('Dilnoza');
    expect(screen.getByText('Javob berish muddati')).toBeTruthy();
    await tap('Tasdiqlash');
    expect(await screen.findByText(/Hamyoningizda: 481\s000/)).toBeTruthy();
  });
});
