import { ApiError, type MarketClient } from '@platform/api-client';
import type { RideRequest } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { statusIcon } from './fact-chips';
import { quickRoute, recommendation, renderMarket, takePoint, tap } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { openRequest } from './request-test-kit';
import { RequestsSearchFlow } from './requests-search-flow';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const own = { bookings: { myBookings: async () => [], myOffers: async () => [] } };

describe('The requests of a passenger (G37, docs/101)', { timeout: 20_000 }, () => {
  it('shows the own request without the own face, with the price of one seat and a waiting mark', async () => {
    const myRequests = vi.fn(async (): Promise<RideRequest[]> => [request]);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({ market: { myRequests }, ...own }),
    );
    expect(await screen.findByText('bir joy uchun')).toBeTruthy();
    expect(screen.queryByText('Dilnoza')).toBeNull();
    expect(statusIcon('open')).toBe('waiting');
  });

  it('offers the request already left on that day instead of a second one (R5)', async () => {
    const myRequests = vi.fn(async (): Promise<RideRequest[]> => {
      const sent = publishRequest.mock.calls[0]?.[0];
      return sent ? [{ ...request, from: sent.from, to: sent.to, date: sent.date }] : [];
    });
    const publishRequest = openRequest({ mine: { myRequests } });
    publishRequest.mockRejectedValueOnce(new ApiError(409, 'trips.request_exists'));
    await quickRoute();
    await tap(/^Ertaga/);
    await tap('Uyimdan');
    await takePoint('Chorsu bozori yaqinida');
    await takePoint('Yangi Margʻilon');
    await tap('Davom etish');
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Bu kunga shu yoʻnalishda soʻrovingiz bor.')).toBeTruthy();
    await tap('Soʻrovni ochish');
    expect(await screen.findByText('Soʻrovni bekor qilish')).toBeTruthy();
  });
});

describe('The requests a driver looks for (G37, docs/101)', { timeout: 20_000 }, () => {
  const open = async (searchRequests: MarketClient['searchRequests']) => {
    renderMarket(
      <RequestsSearchFlow onBack={() => undefined} />,
      testClients({ market: { searchRequests, recommend: async () => recommendation } }),
    );
    // «Qayerga» opens by itself, both ends go on at once (G40, docs/106 K1).
    for (const step of ['Qayerdan', 'Toshkent shahri', 'Chilonzor', 'Fargʻona viloyati', 'Fargʻona shahri'])
      await tap(step);
  };

  it('opens today at once and moves to tomorrow on the screen (R2)', async () => {
    const searchRequests = vi.fn<MarketClient['searchRequests']>(async () => [request]);
    await open(searchRequests);
    expect(await screen.findByText(/^Bugun, /u)).toBeTruthy();
    expect(screen.queryByText('Qaysi kuni?')).toBeNull();
    // A driver sees who asks, and the price of one seat (R7).
    expect(await screen.findByText('Dilnoza')).toBeTruthy();
    expect(screen.getByText('bir joy uchun')).toBeTruthy();
    await tap('Ertaga');
    expect(await screen.findByText(/^Ertaga, /u)).toBeTruthy();
    await waitFor(() => expect(searchRequests).toHaveBeenCalledTimes(2));
  });

  it('speaks of waiting passengers only when there are some, and publishes a trip from an empty day (R3, R4)', async () => {
    await open(async () => []);
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    expect(screen.queryByText(/taklifingizni kutmoqda/u)).toBeNull();
    expect(screen.queryByText('Xabar bering')).toBeNull();
    await tap('Safar eʼlon qilish');
    // No pitak on the direction: no choice of the way, the day is next (G40, docs/106 K2).
    expect(await screen.findByText('Qachon joʻnaysiz?')).toBeTruthy();
  });
});
