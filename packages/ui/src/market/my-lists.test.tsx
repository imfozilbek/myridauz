import type { BookingsClient, MarketClient } from '@platform/api-client';
import { offer } from '../bookings/booking-test-kit';
import type { RideRequest } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DriverContext, type Driver } from '../driver/driver-context';
import { testClients } from '../test-shell';
import { recommendation, renderMarket, tap, trip, openOwnTrip } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { MyTripsScreen } from './my-trips-screen';
import { RequestsSearchFlow } from './requests-search-flow';

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
    // The status is a badge; each fact of the way has its icon (docs/88 L15).
    expect(screen.getAllByText('Faol').some((text) => text.closest('.trip-status'))).toBe(true);
    expect(document.querySelectorAll('.fact-icon').length).toBeGreaterThan(0);
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
    await tap('bir joy uchun');
    await tap('Soʻrovni bekor qilish');
    expect(cancelRequest).toHaveBeenCalledWith('r1');
  });
});

describe('RequestsSearchFlow: a driver finds passengers (docs/09)', () => {
  it('shows the requests of a day and sends an offer with the commission', async () => {
    const searchRequests = vi.fn<MarketClient['searchRequests']>(async () => [request]);
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    renderMarket(
      <RequestsSearchFlow onBack={() => undefined} />,
      testClients({
        market: { searchRequests, recommend: async () => recommendation },
        bookings: { sendOffer },
      }),
    );
    for (const step of [
      'Qayerdan',
      'Toshkent shahri',
      'Butun shahar',
      'Fargʻona viloyati',
      'Butun viloyat',
      /^Ertaga/,
    ])
      await tap(step);
    expect(await screen.findByText('Yoʻlovchilar taklifingizni kutmoqda: vaqt va narx.')).toBeTruthy();
    await tap('Dilnoza');
    await tap('Taklif yuborish');
    await tap('Davom etish');
    await tap('Davom etish');
    // 10% of 95 000 per seat, 2 seats (docs/12).
    expect(await screen.findByText(/19\s000/)).toBeTruthy();
    await tap('Taklif yuborish');
    expect(await screen.findByText('Taklif yuborildi')).toBeTruthy();
    expect(sendOffer.mock.calls[0]?.[1]).toMatchObject({ price: 95000 });
    expect(searchRequests.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730' });
  });

  it('keeps the requests private while the application of the driver is checked', async () => {
    const searchRequests = vi.fn<MarketClient['searchRequests']>(async () => [request]);
    const pending: Driver = {
      application: {
        status: 'pending',
        car: null,
        photos: { front: true, side: true, interior: true },
        reasons: [],
      },
      editCar: () => undefined,
    };
    renderMarket(
      <DriverContext.Provider value={pending}>
        <RequestsSearchFlow onBack={() => undefined} />
      </DriverContext.Provider>,
      testClients({ market: { searchRequests } }),
    );
    expect(await screen.findByText('Yoʻlovchilar soʻrovlarini ariza tasdiqlangach koʻrasiz.')).toBeTruthy();
    expect(searchRequests).not.toHaveBeenCalled();
  });
});
