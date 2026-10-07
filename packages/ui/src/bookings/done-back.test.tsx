import type { BookingsClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openOwnTrip, renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking, confirmed, wallet } from './booking-test-kit';
import { DriverBooking } from './driver-booking';

afterEach(cleanup);

describe('a «done» screen has «Назад» (docs/94 F9)', () => {
  it('the seat confirmed by the driver goes back to the trip', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => confirmed);
    const onClose = vi.fn();
    renderMarket(
      <PlacesGate>
        <DriverBooking booking={booking} onClose={onClose} onMap={() => undefined} />
      </PlacesGate>,
      testClients({ bookings: { answer } }),
    );
    await tap('Tasdiqlash');
    await tap('Tasdiqlash');
    await screen.findByText('Joy tasdiqlandi');
    await tap('Orqaga');
    expect(onClose).toHaveBeenCalledWith(true);
  });
});

describe('the map of a confirmed seat goes back to that seat (docs/94 B8)', () => {
  it('«Назад» from the map shows the booking, not the trip', async () => {
    let seat = booking;
    const answer = vi.fn<BookingsClient['answer']>(async () => (seat = confirmed));
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [seat], driverOffers: async () => [], answer },
        wallet: { mine: async () => wallet },
      }),
    );
    await openOwnTrip();
    await tap('Dilnoza');
    await tap('Tasdiqlash');
    await tap('Tasdiqlash');
    await tap('Safar xaritasi');
    await tap('Orqaga');
    expect(await screen.findByText('Dilnoza')).toBeTruthy();
    expect(screen.queryByText('Safarni bekor qilish')).toBeNull();
  });
});
