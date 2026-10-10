import { ApiError } from '@platform/api-client';
import type { RideRequest } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { statusIcon } from './fact-chips';
import { quickRoute, renderMarket, takePoint, tap } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { openRequest } from './request-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const own = { bookings: { myBookings: async () => [], myOffers: async () => [] } };

describe('The requests of a passenger (G37, docs/101)', { timeout: 20_000 }, () => {
  it('shows the own request without the own face, with its day and its way (mockup g75/2 A)', async () => {
    const myRequests = vi.fn(async (): Promise<RideRequest[]> => [request]);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({ market: { myRequests }, ...own }),
    );
    // The card of mockup g75/2 A: the day, the way, how many people (G75).
    expect(await screen.findByText(/· Soʻrov$/u)).toBeTruthy();
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
    await tap('Olib ketish joyi');
    await takePoint('Chorsu bozori yaqinida');
    await tap('Tushirish joyi');
    await takePoint('Yangi Margʻilon');
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Bu kunga shu yoʻnalishda soʻrovingiz bor.')).toBeTruthy();
    await tap('Soʻrovni ochish');
    expect(await screen.findByText('Soʻrovni bekor qilish')).toBeTruthy();
  });
});
