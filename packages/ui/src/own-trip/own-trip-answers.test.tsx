import { ApiError, type BookingsClient, type ChatClient } from '@platform/api-client';
import type { Booking } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed, wallet } from '../bookings/booking-test-kit';
import { openOwnTrip, renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';

afterEach(cleanup);

type Clients = {
  readonly answer?: BookingsClient['answer'];
  readonly mine?: () => Promise<typeof wallet>;
  readonly socketUrl?: ChatClient['socketUrl'];
};

function open(bookings: () => readonly Booking[], { answer, mine, socketUrl }: Clients = {}) {
  const driverBookings = vi.fn(async () => [...bookings()]);
  const rendered = renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [trip] },
      bookings: { driverBookings, driverOffers: async () => [], ...(answer ? { answer } : {}) },
      wallet: { mine: mine ?? (async () => wallet) },
      ...(socketUrl ? { chat: { socketUrl } } : {}),
    }),
  );
  return openOwnTrip().then(() => ({ ...rendered, driverBookings }));
}

describe('the driver answers a request right in its card (owner decision 06.10.2026, docs/122)', () => {
  it('confirms with one tap: no window, the passenger moves to «Yoʻlovchilar»', async () => {
    let seats: readonly Booking[] = [booking];
    const answer = vi.fn<BookingsClient['answer']>(async () => (seats = [confirmed])[0] as Booking);
    const { tracked } = await open(() => seats, { answer });
    await tap('Tasdiqlash');
    expect(answer).toHaveBeenCalledWith('b1', 'confirm');
    expect(await screen.findByText('Yoʻlovchilar (2)')).toBeTruthy();
    expect(screen.queryByText('Joy soʻraganlar (1)')).toBeNull();
    expect(tracked.some((event) => event.name === 'booking_step' && event.step === 'confirmed')).toBe(true);
  });

  it('declines with one tap', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => ({ ...booking, status: 'declined' }));
    await open(() => [booking], { answer });
    await tap('Rad etish');
    expect(answer).toHaveBeenCalledWith('b1', 'decline');
  });

  it('offers the way to top up, not a «Tasdiqlash» that would fail (G27)', async () => {
    const answer = vi.fn<BookingsClient['answer']>();
    await open(() => [booking], { answer, mine: async () => ({ ...wallet, bonus: 0, main: 0 }) });
    await tap('Hisobni toʻldirish');
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    expect(screen.getByText(/19\s000/u)).toBeTruthy();
    expect(answer).not.toHaveBeenCalled();
  });

  it('goes to the top up when the server says the money is short', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => {
      throw new ApiError(409, 'wallet.not_enough');
    });
    await open(() => [booking], { answer, mine: async () => Promise.reject(new Error('down')) });
    await tap('Tasdiqlash');
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
  });

  it('keeps the page with the reason when an answer fails', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => {
      throw new ApiError(409, 'bookings.wrong_status');
    });
    await open(() => [booking], { answer });
    await tap('Rad etish');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Joy soʻraganlar (1)')).toBeTruthy();
  });

  it('opens the booking with its deadline from the name', async () => {
    await open(() => [booking]);
    await tap('Dilnoza');
    expect(await screen.findByText('Javob berish muddati')).toBeTruthy();
  });
});

describe('a confirmed passenger has the chat and the call (mockup g63/3)', () => {
  it('opens the chat of the booking by each button', async () => {
    const socketUrl = vi.fn<ChatClient['socketUrl']>(async () => Promise.reject(new Error('offline')));
    await open(() => [confirmed], { socketUrl });
    fireEvent.click(await screen.findByRole('button', { name: 'Xabar yozish' }));
    await vi.waitFor(() => expect(socketUrl).toHaveBeenCalledWith(confirmed.chatKey));
    cleanup();
    await open(() => [confirmed], { socketUrl });
    fireEvent.click(await screen.findByRole('button', { name: 'Qoʻngʻiroq' }));
    await vi.waitFor(() => expect(socketUrl).toHaveBeenCalledTimes(2));
  });
});
