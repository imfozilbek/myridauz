import { MY_TRIP_LINK } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
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

// A refresh still on its way.
const LATER = new Promise<never>(() => undefined);

// «Mening safarlarim» opened from the main screen reads the lists the main screen loaded (G77,
// docs/168 B): one load of them, not two.
describe('the lists of «Mening safarlarim»', () => {
  it('of a passenger come from the main screen, shown while they refresh', async () => {
    const myBookings = vi.fn().mockResolvedValueOnce([confirmed]).mockReturnValue(LATER);
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
  });

  it('of a driver come from the main screen, shown while they refresh', async () => {
    const myTrips = vi.fn().mockResolvedValueOnce([confirmed.trip]).mockReturnValue(LATER);
    const driverBookings = vi.fn().mockResolvedValueOnce([confirmed]).mockReturnValue(LATER);
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
  });

  // «Safar» of a trip asks whether a seat of it is asked already: from the same lists (G77).
  it('«Safar» reads the seats of the main screen, shown while they refresh', async () => {
    const asked = { ...confirmed, trip: { ...confirmed.trip, id: 't9' } };
    const myBookings = vi.fn().mockResolvedValueOnce([asked]).mockReturnValue(LATER);
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
    expect(await screen.findByText('Bu safarda joyingiz bor.')).toBeTruthy();
  });

  // The person's own step sends no signal: the screen refreshes the lists as it opens (G77).
  it('opened after the lists of the main screen: refreshes them, the link opens the new trip', async () => {
    const fresh = { ...confirmed.trip, id: '0000000a-0000-4000-8000-000000000009' };
    const myTrips = vi.fn().mockResolvedValueOnce([]).mockResolvedValue([fresh]);
    renderMarket(
      <DriverData>
        <Later>
          <MyTripsScreen onBack={() => undefined} link={{ name: MY_TRIP_LINK, id: fresh.id }} />
        </Later>
      </DriverData>,
      testClients({
        market: { myTrips },
        bookings: {
          driverBookings: async () => [{ ...confirmed, trip: fresh }],
          driverOffers: async () => [],
        },
      }),
    );
    await waitFor(() => expect(myTrips).toHaveBeenCalledOnce());
    fireEvent.click(await screen.findByText('open'));
    expect(await screen.findByText(/^Yoʻlovchilar \(/u)).toBeTruthy();
    expect(myTrips).toHaveBeenCalledTimes(2);
  });

  it('opened after the lists of the main screen: a request sent a moment ago is there', async () => {
    const myRequests = vi.fn().mockResolvedValueOnce([]).mockResolvedValue([request]);
    renderMarket(
      <PassengerData>
        <Later>
          <MyRequestsScreen onBack={() => undefined} />
        </Later>
      </PassengerData>,
      testClients({
        market: { myRequests },
        bookings: { myBookings: async () => [], myOffers: async () => [] },
      }),
    );
    await waitFor(() => expect(myRequests).toHaveBeenCalledOnce());
    fireEvent.click(await screen.findByText('open'));
    await waitFor(() => expect(document.querySelectorAll('.mine-card')).toHaveLength(1));
  });
});

// A screen opened later than the main screen loaded its lists.
function Later({ children }: { readonly children: ReactNode }) {
  const [shown, setShown] = useState(false);
  return shown ? children : <button onClick={() => setShown(true)}>open</button>;
}
