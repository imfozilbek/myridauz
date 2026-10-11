import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed, request } from '../bookings/booking-test-kit';
import { DriverData } from '../home/driver-data';
import { PassengerData } from '../home/passenger-data';
import { testClients } from '../test-shell';
import { SafarScreen } from '../find/safar-screen';
import { renderMarket, trip } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { MyTripsScreen } from './my-trips-screen';
import { PlacesGate } from './places-gate';

afterEach(cleanup);

// «Mening safarlarim» opened from the main screen reads the lists the main screen loaded (G77,
// docs/168 B): one load of them, not two.
describe('the lists of «Mening safarlarim»', () => {
  it('of a passenger come from the main screen', async () => {
    const myBookings = vi.fn(async () => [confirmed]);
    renderMarket(
      <PassengerData>
        <MyRequestsScreen onBack={() => undefined} />
      </PassengerData>,
      testClients({
        market: { myRequests: async () => [request] },
        bookings: { myBookings, myOffers: async () => [] },
      }),
    );
    expect(await screen.findByText('Joy tasdiqlandi')).toBeTruthy();
    expect(myBookings).toHaveBeenCalledOnce();
  });

  it('of a driver come from the main screen, only the offers load here', async () => {
    const myTrips = vi.fn(async () => [confirmed.trip]);
    const driverBookings = vi.fn(async () => [confirmed]);
    renderMarket(
      <DriverData>
        <MyTripsScreen onBack={() => undefined} />
      </DriverData>,
      testClients({
        market: { myTrips },
        bookings: { driverBookings, driverOffers: async () => [] },
      }),
    );
    expect(await screen.findByText('Faol (1)')).toBeTruthy();
    expect(myTrips).toHaveBeenCalledOnce();
    expect(driverBookings).toHaveBeenCalledOnce();
  });

  // «Safar» of a trip asks whether a seat of it is asked already: from the same lists (G77).
  it('«Safar» reads the seats of the main screen', async () => {
    const myBookings = vi.fn(async () => [confirmed]);
    renderMarket(
      <PassengerData>
        <PlacesGate onBack={() => undefined}>
          <SafarScreen trip={{ ...trip, id: 't9' }} onBack={() => undefined} onBook={() => undefined} />
        </PlacesGate>
      </PassengerData>,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings, myOffers: async () => [] },
      }),
    );
    expect(await screen.findByText(/joy band qilish$/u)).toBeTruthy();
    await act(() => Promise.resolve());
    expect(myBookings).toHaveBeenCalledOnce();
  });
});
