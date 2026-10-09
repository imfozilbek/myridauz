import type { BookingsClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { DriverContext } from '../driver/driver-context';
import { approved } from '../home/home-test-kit';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { asked, board, NOW, openBoard, salon } from './board-test-kit';
import { RequestsFlow } from './requests-flow';

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('«Yoʻlovchilar soʻrovlari» (G64, docs/118 path 7)', { timeout: 20_000 }, () => {
  it('shows the days with their counts and a card with the rating, the route, the price and the marks', async () => {
    const requestBoard = openBoard();
    expect(await screen.findByText('Dilnoza')).toBeTruthy();
    expect(screen.getByText('★ 4,8')).toBeTruthy();
    expect(screen.getByText('Chilonzor → Fargʻona')).toBeTruthy();
    expect(screen.getByText('95 000')).toBeTruthy();
    expect(screen.getByText('2 kishi')).toBeTruthy();
    expect(screen.getByText('Uyidan yoki pitakdan')).toBeTruthy();
    expect(screen.getByText('5 ta')).toBeTruthy();
    // The numbers stay hidden: a chat and a call inside the app, before any booking (docs/07).
    expect(screen.getByLabelText('Xabar yozish')).toBeTruthy();
    expect(screen.getByLabelText('Qoʻngʻiroq')).toBeTruthy();
    await tap('Ertaga');
    await waitFor(() => expect(requestBoard).toHaveBeenLastCalledWith({ date: '2026-10-03' }));
  });

  it('with a live trip: the banner, the requests that fit it and one tap offers the trip', async () => {
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    openBoard({
      requestBoard: async () => board({ trip, fits: [{ ...asked, extraKm: 2 }], others: [] }),
      bookings: { sendOffer },
    });
    expect(await screen.findByText('Safaringiz: bugun 08:00, Fargʻona')).toBeTruthy();
    expect(screen.getByText('3 boʻsh joy · 95 000')).toBeTruthy();
    expect(screen.getByText('Safaringizga mos (1)')).toBeTruthy();
    // One line of words that wraps as the words of the mockup do (g64/2 phone 1).
    expect(screen.getByText('Chilonzor → Fargʻona · +2 km')).toBeTruthy();
    // No day buttons while a trip leads the screen (mockup g64/2).
    expect(screen.queryByText('Ertaga')).toBeNull();
    await tap('Safarimga taklif qilish');
    await waitFor(() =>
      expect(sendOffer).toHaveBeenCalledWith('r1', { departAt: trip.departAt, price: 95000, tripId: 't1' }),
    );
  });

  it('a whole car of another day says the day of the trip it opens (mockup g64/3 phone 1)', async () => {
    const later = { ...salon, date: '2026-10-03' };
    openBoard({
      requestBoard: async () =>
        board({ date: '2026-10-03', others: [later, { ...asked, date: '2026-10-03' }] }),
    });
    expect(await screen.findByText('Chilonzor → Fargʻona · ertaga')).toBeTruthy();
    expect(screen.getByText('Chilonzor → Fargʻona')).toBeTruthy();
    cleanup();
    openBoard({ requestBoard: async () => board({ others: [salon] }) });
    expect(await screen.findByText('Chilonzor → Fargʻona')).toBeTruthy();
    expect(screen.queryByText(/· bugun/u)).toBeNull();
  });

  it('a request with a live offer of the driver says «Taklif yuborildi» and asks no second one', async () => {
    openBoard({ bookings: { driverOffers: async () => [offer] } });
    const sent = await screen.findByText('Taklif yuborildi');
    expect((sent as HTMLButtonElement).disabled).toBe(true);
  });

  it('opens the talk about the request before a booking: a chat, or a call at once', async () => {
    const openTalk = vi.fn<BookingsClient['openTalk']>(async () => 'ttalk1');
    openBoard({ bookings: { openTalk } });
    fireEvent.click(await screen.findByLabelText('Qoʻngʻiroq'));
    await waitFor(() => expect(openTalk).toHaveBeenCalledWith('r1'));
  });

  it('asks the route first while the driver has no direction yet', async () => {
    const requestBoard = openBoard({
      requestBoard: async (query) => (query.from ? board() : board({ known: false })),
    });
    for (const step of ['Qayerdan', 'Toshkent shahri', 'Chilonzor', 'Fargʻona viloyati', 'Fargʻona shahri'])
      await tap(step);
    await waitFor(() => expect(requestBoard).toHaveBeenLastCalledWith({ from: '1726269', to: '1730401' }));
    expect(await screen.findByText('Dilnoza')).toBeTruthy();
  });

  it('an empty day leads to a new trip; an empty day under a trip does not', async () => {
    openBoard({ requestBoard: async () => board({ others: [] }) });
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    expect(screen.getByText('Safar eʼlon qilish')).toBeTruthy();
    cleanup();
    openBoard({ requestBoard: async () => board({ trip, others: [] }) });
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    expect(screen.queryByText('Safar eʼlon qilish')).toBeNull();
  });

  it('the route chosen for the board goes on to the new trip of an empty day (G37 R4)', async () => {
    openBoard({
      requestBoard: async (query) => (query.from ? board({ others: [] }) : board({ known: false })),
    });
    for (const step of ['Qayerdan', 'Toshkent shahri', 'Chilonzor', 'Fargʻona viloyati', 'Fargʻona shahri'])
      await tap(step);
    await tap('Safar eʼlon qilish');
    expect(await screen.findByText('Chilonzor, Toshkent shahri')).toBeTruthy();
    expect(screen.getByText('Mashinada 4 joy')).toBeTruthy();
  });

  it('keeps the requests private while the application of the driver is checked', async () => {
    const requestBoard = vi.fn(async () => board());
    const pending = { ...approved, application: { ...approved.application, status: 'pending' as const } };
    renderMarket(
      <DriverContext.Provider value={pending}>
        <RequestsFlow onBack={() => undefined} />
      </DriverContext.Provider>,
      testClients({ market: { requestBoard } }),
    );
    expect(await screen.findByText('Yoʻlovchilar soʻrovlarini ariza tasdiqlangach koʻrasiz.')).toBeTruthy();
    expect(requestBoard).not.toHaveBeenCalled();
  });
});
