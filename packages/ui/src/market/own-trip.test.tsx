import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { openOwnTrip, renderMarket, trip } from './market-test-kit';
import { MyTripsScreen } from './my-trips-screen';

afterEach(cleanup);

describe('the own trip of a driver (docs/86 V11)', () => {
  it('does not show the driver himself; his passengers come first', async () => {
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    await openOwnTrip();
    expect(await screen.findByText('Safar eʼlon qilindi')).toBeTruthy();
    expect(screen.queryByText('Haydovchi')).toBeNull();
    expect(screen.queryByText('Jasur')).toBeNull();
    // The passengers first, then the trip and its tiles (mockup g63/3).
    const passengers = screen.getByText('Yoʻlovchilar (0)');
    const family = screen.getByText('Yaqinlarimga');
    expect(passengers.compareDocumentPosition(family) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the requests by the time they came, the far one asked first on top (mockup g63/4 screen 6)', async () => {
    const asked = (id: string, firstName: string, extraKm: number, createdAt: number) => ({
      ...booking,
      id,
      extraKm,
      createdAt,
      passenger: { ...booking.passenger, firstName },
    });
    const madina = asked('m1', 'Madina', 2, booking.createdAt);
    const akmal = asked('a1', 'Akmal', 0, booking.createdAt + 60_000);
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [akmal, madina], driverOffers: async () => [] },
      }),
    );
    await openOwnTrip();
    const first = await screen.findByText('Madina');
    expect(
      first.compareDocumentPosition(screen.getByText('Akmal')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
