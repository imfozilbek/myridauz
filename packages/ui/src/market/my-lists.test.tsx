import type { MarketClient } from '@platform/api-client';
import type { RideRequest } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap, trip } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { MyTripsScreen } from './my-trips-screen';
import { RequestsSearchFlow } from './requests-search-flow';

afterEach(cleanup);

const request: RideRequest = {
  id: 'r1',
  passenger: { id: 9, firstName: 'Dilnoza', hasAvatar: false },
  from: '1726269',
  to: '1730401',
  date: '2026-10-02',
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open',
};

describe('Mening safarlarim (docs/35)', () => {
  it('lets a driver cancel an active trip', async () => {
    const cancelTrip = vi.fn(async () => ({ ...trip, status: 'cancelled' as const }));
    const myTrips = vi.fn(async () => [trip]);
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({ market: { myTrips, cancelTrip } }),
    );
    expect(await screen.findByText(/Faol/)).toBeTruthy();
    await tap('Chilonzor → Fargʻona shahri');
    await tap('Safarni bekor qilish');
    expect(cancelTrip).toHaveBeenCalledWith('t1');
    expect(myTrips).toHaveBeenCalledTimes(2);
  });

  it('lets a passenger cancel an open request', async () => {
    const cancelRequest = vi.fn(async () => ({ ...request, status: 'cancelled' as const }));
    const myRequests = vi.fn(async () => [request]);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({ market: { myRequests, cancelRequest } }),
    );
    await tap('Chilonzor → Fargʻona shahri');
    expect(screen.getByText('Faol')).toBeTruthy();
    await tap('Soʻrovni bekor qilish');
    expect(cancelRequest).toHaveBeenCalledWith('r1');
  });
});

describe('RequestsSearchFlow: a driver finds passengers (docs/09)', () => {
  it('shows the requests of a day and says an offer comes later', async () => {
    const searchRequests = vi.fn<MarketClient['searchRequests']>(async () => [request]);
    renderMarket(
      <RequestsSearchFlow onBack={() => undefined} />,
      testClients({ market: { searchRequests } }),
    );
    for (const step of [
      'Qayerdan',
      'Toshkent shahri',
      'Butun shahar',
      'Qayerga',
      'Fargʻona viloyati',
      'Butun viloyat',
      'Davom etish',
      /^Ertaga/,
    ])
      await tap(step);
    await tap('Chilonzor → Fargʻona shahri');
    await tap('Taklif yuborish');
    expect(screen.getByText('Yoʻlovchiga taklif yuborish tez orada ishga tushadi.')).toBeTruthy();
    expect(searchRequests.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730' });
  });
});
