import type { MarketClient } from '@platform/api-client';
import type { RideRequest } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { recommendation } from '../market/market-test-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmed, request } from '../bookings/booking-test-kit';
import { searchMarket } from '../find/search-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { pickDay } from '../days/week-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const open = (
  asked: readonly RideRequest[],
  recommend = vi.fn<MarketClient['recommend']>(() => new Promise(() => undefined)),
) => {
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [...asked], recommend },
      bookings: { myBookings: async () => [confirmed], myOffers: async () => [] },
    }),
  );
  return recommend;
};

// «Mening safarlarim» of a passenger, mockup g75/2 A (G75, docs/158 Е): a card for each seat and
// request; an old request says so and is sent again in one tap; nothing live: «Safar topish».
describe('«Mening safarlarim» of a passenger', { timeout: 15_000 }, () => {
  it('counts the seat and both requests, the old one with «Qayta yuborish»', async () => {
    const recommend = open([request, { ...request, id: 'r2', status: 'expired' }]);
    expect(await screen.findByText('Faol (3)')).toBeTruthy();
    expect(screen.getByText('Joy tasdiqlandi')).toBeTruthy();
    expect(screen.getByText('Muddati oʻtdi')).toBeTruthy();
    expect(screen.getAllByText('2 kishi')).toHaveLength(2);
    await tap('Qayta yuborish');
    // The same way again: the request opens with its route and asks the day, never «today» by
    // itself (G77, docs/170 О2); «Назад» from the points comes back to the day.
    expect(recommend).toHaveBeenCalledWith(request.from, request.to);
    await pickDay(1);
    await waitFor(() => expect(screen.queryByText('Qaysi kuni?')).toBeNull());
    await tap('Orqaga');
    expect(await screen.findByText('Qaysi kuni?')).toBeTruthy();
  });

  // G79 П11 (docs/170): «Qayta yuborish» keeps the people, the price, «Boʻsh salon» and «ayol» of
  // the old request; up to 4 taps → 0.
  it('sends an old request again with its people, price and car as they were', async () => {
    const old = { ...request, id: 'r3', status: 'expired' as const, seats: 3, price: 110_000 };
    open(
      [{ ...old, wholeCar: true, withWoman: true }],
      vi.fn(async () => recommendation),
    );
    await tap('Qayta yuborish');
    await pickDay(1);
    expect(await screen.findByText(/^3 joy × 110[\s.]000$/u)).toBeTruthy();
    const checked = (name: string) => (screen.getByRole('checkbox', { name }) as HTMLInputElement).checked;
    expect(checked('Boʻsh salon kerak')).toBe(true);
    expect(checked('Men bilan ayol bor')).toBe(true);
  });

  it('says there is nothing live and offers «Safar topish»', async () => {
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { ...searchMarket(), myRequests: async () => [] },
        bookings: { myBookings: async () => [], myOffers: async () => [] },
      }),
    );
    expect(await screen.findByText('Faol safar yoʻq')).toBeTruthy();
    expect(screen.getByText('Safar toping yoki soʻrov qoldiring.')).toBeTruthy();
    await tap('Safar topish');
    expect(await screen.findByText('Qayerdan yoʻlga chiqasiz?')).toBeTruthy();
  });

  it('«Oʻtgan» without past trips says so, the routes and the drivers stay under it', async () => {
    open([request]);
    await tap('Oʻtgan');
    expect(screen.getByText('Oʻtgan safar yoʻq')).toBeTruthy();
    expect(screen.getByText('Obunalar')).toBeTruthy();
  });
});
