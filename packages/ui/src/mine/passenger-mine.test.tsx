import type { RideRequest } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmed, request } from '../bookings/booking-test-kit';
import { searchMarket } from '../find/search-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const open = (
  asked: readonly RideRequest[],
  recommend = vi.fn(() => new Promise<never>(() => undefined)),
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
    await tap(/^Ertaga/u);
    await waitFor(() => expect(screen.queryByText(/^Ertaga/u)).toBeNull());
    await tap('Orqaga');
    expect(await screen.findByText(/^Ertaga/u)).toBeTruthy();
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
