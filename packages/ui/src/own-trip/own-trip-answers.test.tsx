import { ApiError, type BookingsClient, type ChatClient } from '@platform/api-client';
import type { Booking } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed, wallet } from '../bookings/booking-test-kit';
import { FakePeer, fakeStream } from '../call/fake-voice';
import { FakeSocket } from '../chat/fake-socket';
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
    // A sheet over the trip (G75, mockup g75/4 B): only the sum short, then the ready message.
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    expect(screen.getByText('Komissiya · 2 joy')).toBeTruthy();
    expect(screen.getAllByText(/19\s000/u).length).toBeGreaterThan(0);
    expect(screen.getByText('Dilnozaning joyini tasdiqlash uchun')).toBeTruthy();
    expect(answer).not.toHaveBeenCalled();
    const sent = vi.spyOn(window, 'open').mockReturnValue(null);
    const buttons = screen.getAllByRole('button', { name: 'Hisobni toʻldirish' });
    fireEvent.click(buttons.at(-1) as HTMLElement);
    const url = decodeURIComponent(String(sent.mock.calls[0]?.[0]));
    expect(url).toMatch(/\?text=Salom! Hamyonimni toʻldirmoqchiman\. Dilnozaning joyini tasdiqlash/u);
    sent.mockRestore();
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
  const answered = async () => {
    await vi.waitFor(() => expect(FakeSocket.last).not.toBeNull());
    const socket = FakeSocket.last as FakeSocket;
    act(() => {
      socket.open();
      socket.receive({ type: 'history', messages: [], canCall: true });
    });
    return () => socket.sent.map((data) => JSON.parse(data) as Record<string, unknown>);
  };
  const RING = { type: 'call', action: 'ring' };

  beforeEach(() => {
    FakeSocket.last = null;
    vi.stubGlobal('WebSocket', FakeSocket);
    vi.stubGlobal('RTCPeerConnection', FakePeer);
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: async () => fakeStream() } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('the call button rings the passenger as the chat header does', async () => {
    const socketUrl = vi.fn<ChatClient['socketUrl']>(async () => 'wss://api.test/socket');
    await open(() => [confirmed], { socketUrl });
    fireEvent.click(await screen.findByRole('button', { name: 'Qoʻngʻiroq' }));
    const sent = await answered();
    expect(socketUrl).toHaveBeenCalledWith(confirmed.chatKey);
    await vi.waitFor(() => expect(sent()).toContainEqual(RING));
  });

  it('the chat button opens the chat and never rings by itself', async () => {
    await open(() => [confirmed], { socketUrl: async () => 'wss://api.test/socket' });
    fireEvent.click(await screen.findByRole('button', { name: 'Xabar yozish' }));
    const sent = await answered();
    await act(async () => undefined);
    expect(sent()).not.toContainEqual(RING);
  });

  it('asks no wallet while no request waits for an answer (docs/117)', async () => {
    const mine = vi.fn(async () => wallet);
    await open(() => [confirmed], { mine });
    expect(await screen.findByText('Yoʻlovchilar (2)')).toBeTruthy();
    await tap('Dilnoza');
    expect(await screen.findByText('Joyni bekor qilish')).toBeTruthy();
    expect(mine).not.toHaveBeenCalled();
  });
});
