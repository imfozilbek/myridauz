import { ApiError, type BookingsClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip, openOwnTrip } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';
import { booking, confirmed, offer } from './booking-test-kit';

afterEach(cleanup);

describe('a passenger in "Mening safarlarim" (docs/35)', () => {
  it('sees a confirmed seat with the plate and the own points, and cancels it', async () => {
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () => booking);
    const { tracked } = renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [], cancelMine },
      }),
    );
    expect(await screen.findByText('Band qilingan joylar')).toBeTruthy();
    await tap('Jasur');
    expect(screen.getByText('01 A 123 BC')).toBeTruthy();
    // The plate of the page says the seat is confirmed (G60, mockup g60/1).
    expect(screen.getByText('Joy tasdiqlandi')).toBeTruthy();
    // «The places do not change» was said before the booking, not again (G40, docs/106 C9).
    expect(screen.queryByText(/^Bron qilingach/)).toBeNull();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    // The points fixed at the booking open in a map (docs/70).
    await tap('Chilonzor bozori yaqinida');
    expect(open.mock.calls[0]?.[0]).toContain('41.2856');
    // The passenger never sees the driver's commission.
    expect(screen.queryByText('Komissiya')).toBeNull();
    vi.stubGlobal('confirm', () => true);
    await tap('Joyni bekor qilish');
    vi.unstubAllGlobals();
    expect(cancelMine).toHaveBeenCalledWith('b1');
    await vi.waitFor(() =>
      expect(tracked.some((event) => event.name === 'booking_step' && event.step === 'cancelled')).toBe(true),
    );
  });

  it('sees until when the driver answers a waiting seat (U4)', async () => {
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [booking], myOffers: async () => [] },
      }),
    );
    await tap('Jasur');
    expect(await screen.findByText(/gacha javob beradi/u)).toBeTruthy();
  });
});

describe('a driver answers a booking (docs/35, docs/12)', () => {
  const driverClients = (answer: BookingsClient['answer']) =>
    testClients({
      market: { myTrips: async () => [trip] },
      bookings: { driverBookings: async () => [booking], driverOffers: async () => [offer], answer },
    });

  it('confirms after "Joyni tasdiqlaysizmi?" with the commission', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => confirmed);
    renderMarket(<MyTripsScreen onBack={() => undefined} />, driverClients(answer));
    expect(await screen.findByText('Yuborilgan takliflar')).toBeTruthy();
    await openOwnTrip();
    await tap('Dilnoza');
    // The driver never sees a passenger's contacts, only the name.
    expect(screen.queryByText(/\+998/)).toBeNull();
    await tap('Tasdiqlash');
    expect(screen.getByText('Joyni tasdiqlaysizmi?')).toBeTruthy();
    expect(screen.getByText(/19\s000/)).toBeTruthy();
    await tap('Tasdiqlash');
    expect(await screen.findByText('Joy tasdiqlandi')).toBeTruthy();
    expect(answer).toHaveBeenCalledWith('b1', 'confirm');
    // The buttons go where the text calls: the map of the trip and the chat (docs/89 D5).
    expect(screen.getByText('Safar xaritasi')).toBeTruthy();
    expect(screen.getByText('Xabar yozish')).toBeTruthy();
    expect(screen.queryByText('Tayyor')).toBeNull();
  });

  it('without money explains how to top up', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => {
      throw new ApiError(409, 'wallet.not_enough');
    });
    renderMarket(<MyTripsScreen onBack={() => undefined} />, driverClients(answer));
    await openOwnTrip();
    await tap('Dilnoza');
    await tap('Tasdiqlash');
    await tap('Tasdiqlash');
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    await tap('Hisobni toʻldirish');
    expect(screen.getByText(/qoʻllab-quvvatlash/)).toBeTruthy();
    // The way out is one tap: the support chat of the brand opens (docs/86 V3).
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await tap('Qoʻllab-quvvatlashga yozish');
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.support}`);
    open.mockRestore();
  });

  it('declines a booking', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => ({ ...booking, status: 'declined' }));
    renderMarket(<MyTripsScreen onBack={() => undefined} />, driverClients(answer));
    await openOwnTrip();
    await tap('Dilnoza');
    await tap('Rad etish');
    expect(answer).toHaveBeenCalledWith('b1', 'decline');
  });
});
