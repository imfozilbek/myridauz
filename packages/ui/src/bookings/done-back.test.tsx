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

describe('the answer goes back to the trip (docs/94 F9, owner decision 06.10.2026)', () => {
  it('a seat confirmed on its booking closes it with fresh data, no «done» screen', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => confirmed);
    const onClose = vi.fn();
    renderMarket(
      <PlacesGate>
        <DriverBooking booking={booking} onClose={onClose} />
      </PlacesGate>,
      testClients({ bookings: { answer } }),
    );
    await tap('Tasdiqlash');
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
    expect(answer).toHaveBeenCalledTimes(1);
  });
});

describe('the map of the way goes back to the trip (docs/94 B8)', () => {
  it('«Назад» from the map shows «Mening safarim»', async () => {
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [confirmed], driverOffers: async () => [] },
        wallet: { mine: async () => wallet },
      }),
    );
    await openOwnTrip();
    await tap('Yoʻl xaritasi');
    await screen.findByText(/ · \d+ yoʻlovchi$/u);
    await tap('Orqaga');
    expect(await screen.findByText('Yoʻlovchilar (2)')).toBeTruthy();
  });
});
