import { ApiError, type BookingsClient, type MarketClient } from '@platform/api-client';
import type { Booking } from '@platform/contracts';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedContext } from '../feed/feed-context';
import { renderMarket, tap, trip, openOwnTrip } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// A channel the test fires: "another person changed something" (docs/64).
function feed() {
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => (
    listeners.add(listener),
    () => void listeners.delete(listener)
  );
  return { subscribe, fire: () => act(() => listeners.forEach((listener) => listener())) };
}

describe('an open booking stays fresh and clear (docs/65 B2, B3, B4)', () => {
  it('shows the driver cancel on the open booking without closing it', async () => {
    const channel = feed();
    let mine: Booking[] = [confirmed];
    renderMarket(
      <FeedContext.Provider value={channel.subscribe}>
        <MyRequestsScreen onBack={() => undefined} />
      </FeedContext.Provider>,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => mine, myOffers: async () => [] },
      }),
    );
    await tap('Jasur');
    expect(screen.getByText('Davlat raqami')).toBeTruthy();
    mine = [{ ...confirmed, status: 'cancelled_by_driver' }];
    channel.fire();
    expect(await screen.findByText('Haydovchi bekor qildi')).toBeTruthy();
  });

  it('hides the tools of a confirmed seat once the driver cancels it', async () => {
    const channel = feed();
    let mine: Booking[] = [confirmed];
    renderMarket(
      <FeedContext.Provider value={channel.subscribe}>
        <MyRequestsScreen onBack={() => undefined} />
      </FeedContext.Provider>,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => mine, myOffers: async () => [] },
      }),
    );
    await tap('Jasur');
    expect(screen.getByText('Mashinaga chiqdim')).toBeTruthy();
    mine = [{ ...confirmed, status: 'cancelled_by_driver' }];
    channel.fire();
    await screen.findByText('Haydovchi bekor qildi');
    // «Mashinaga chiqdim» and «Yetib keldim» are only for a seat that still goes (docs/65 B2).
    expect(screen.queryByText('Mashinaga chiqdim')).toBeNull();
    expect(screen.queryByText('Yetib keldim')).toBeNull();
  });

  it('asks before a cancel and keeps the seat on "no"', async () => {
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () => confirmed);
    vi.stubGlobal('confirm', () => false);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [], cancelMine },
      }),
    );
    await tap('Jasur');
    await tap('Joyni bekor qilish');
    expect(cancelMine).not.toHaveBeenCalled();
    expect(screen.getByText('Davlat raqami')).toBeTruthy();
  });

  it('keeps the booking open with the reason when the cancel did not work', async () => {
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () =>
      Promise.reject(new ApiError(409, 'bookings.wrong_status')),
    );
    vi.stubGlobal('confirm', () => true);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [], cancelMine },
      }),
    );
    await tap('Jasur');
    await tap('Joyni bekor qilish');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Bu soʻrov allaqachon oʻzgargan. Roʻyxatni yangilang.')).toBeTruthy();
    expect(screen.getByText('Davlat raqami')).toBeTruthy();
  });

  it('asks the driver before a trip cancel and shows why it did not work', async () => {
    const cancelTrip = vi.fn<MarketClient['cancelTrip']>(async () => Promise.reject(new Error('down')));
    vi.stubGlobal('confirm', () => true);
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip], cancelTrip },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    await openOwnTrip();
    await tap('Safarni bekor qilish');
    expect(cancelTrip).toHaveBeenCalledWith(trip.id);
    expect(await screen.findByText('Birozdan keyin qayta urinib koʻring.')).toBeTruthy();
    expect(screen.getByText('Safarni bekor qilish')).toBeTruthy();
  });
});
