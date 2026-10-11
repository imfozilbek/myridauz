import type { RideRequest } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap, trip, openOwnTrip } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { MyTripsScreen } from './my-trips-screen';

afterEach(cleanup);

const request: RideRequest = {
  id: 'r1',
  passenger: { id: '00000000000000000000000000000009', firstName: 'Dilnoza', hasAvatar: false },
  from: '1726269',
  to: '1730401',
  date: '2026-10-02',
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open',
  pickupMode: 'both',
  wholeCar: false,
  withWoman: false,
  callsOff: false,
  views: 0,
};

describe('Mening safarlarim (docs/35)', () => {
  it('shows a driver the trips, not the driver himself on each card (U6)', async () => {
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    expect(await screen.findByText(/Faol/)).toBeTruthy();
    expect(screen.queryByText('Jasur')).toBeNull();
  });

  it('lets a driver cancel an active trip', async () => {
    const cancelTrip = vi.fn(async () => ({ ...trip, status: 'cancelled' as const }));
    const myTrips = vi.fn(async () => [trip]);
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips, cancelTrip },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    expect(await screen.findByText(/Faol/)).toBeTruthy();
    await openOwnTrip();
    vi.stubGlobal('confirm', () => true);
    await tap('Safarni bekor qilish');
    vi.unstubAllGlobals();
    expect(cancelTrip).toHaveBeenCalledWith('t1');
    await vi.waitFor(() => expect(myTrips).toHaveBeenCalledTimes(2));
  });

  it('keeps a trip that already left: no cancel on the road (docs/83 N02)', async () => {
    const onTheRoad = { ...trip, departAt: Date.now() - 60 * 60 * 1000 };
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [onTheRoad] },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    await openOwnTrip();
    expect(screen.queryByText('Safarni bekor qilish')).toBeNull();
  });

  it('lets a passenger cancel an open request', async () => {
    const cancelRequest = vi.fn(async () => ({ ...request, status: 'cancelled' as const }));
    const myRequests = vi.fn(async () => [request]);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests, cancelRequest },
        bookings: { myBookings: async () => [], myOffers: async () => [] },
      }),
    );
    await tap(/· Soʻrov$/u);
    const asked = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await tap('Soʻrovni bekor qilish');
    await vi.waitFor(() => expect(cancelRequest).toHaveBeenCalledWith('r1'));
    asked.mockRestore();
  });
});
