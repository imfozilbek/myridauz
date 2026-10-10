import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { BookingBanner } from './booking-banner';
import { confirmed } from './booking-test-kit';

afterEach(cleanup);

// The end of one seat said as it is (G75, docs/158 А).
describe('a seat after «Yoʻlga chiqdim» and after a cancel of the driver', () => {
  it('offers no cancel once the driver left: the server refuses it', async () => {
    const left = { ...confirmed, trip: { ...confirmed.trip, departedAt: Date.now() } };
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [left], myOffers: async () => [] },
      }),
    );
    await tap('Jasur');
    expect(screen.queryByText('Joyni bekor qilish')).toBeNull();
  });

  it('says the seat was cancelled when the trip still goes, the trip when it does not', async () => {
    const seat = { ...confirmed, status: 'cancelled_by_driver' as const };
    const banner = (shown: typeof seat) =>
      renderMarket(
        <PlacesGate>
          <BookingBanner booking={shown} />
        </PlacesGate>,
        testClients({}),
      );
    banner(seat);
    expect(await screen.findByText('Haydovchi joyingizni bekor qildi.')).toBeTruthy();
    cleanup();
    banner({ ...seat, trip: { ...seat.trip, status: 'cancelled' } });
    expect(await screen.findByText('Haydovchi safarni bekor qildi.')).toBeTruthy();
  });
});
