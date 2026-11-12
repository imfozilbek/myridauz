import { toCyrillic } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import type { RideRequest } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { quickRoute, renderMarket, takePoint, tap } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { openRequest } from './request-test-kit';
import { pickDay } from '../days/week-test-kit';

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
    expect(await screen.findByText(/· Сўров$/u)).toBeTruthy();
    expect(screen.queryByText('Dilnoza')).toBeNull();
  });

  it('offers the request already left on that day instead of a second one (R5)', async () => {
    const myRequests = vi.fn(async (): Promise<RideRequest[]> => {
      const sent = publishRequest.mock.calls[0]?.[0];
      return sent ? [{ ...request, from: sent.from, to: sent.to, date: sent.date }] : [];
    });
    const publishRequest = openRequest({ mine: { myRequests } });
    publishRequest.mockRejectedValueOnce(new ApiError(409, 'trips.request_exists'));
    await quickRoute();
    await pickDay(1);
    await tap(toCyrillic('Olib ketish joyi'));
    await takePoint(toCyrillic('Chorsu bozori yaqinida'));
    await takePoint(toCyrillic('Yangi Margʻilon'));
    await tap(toCyrillic('Soʻrov qoldirish'));
    expect(await screen.findByText(toCyrillic('Bu kunga shu yoʻnalishda soʻrovingiz bor.'))).toBeTruthy();
    await tap(toCyrillic('Soʻrovni ochish'));
    expect(await screen.findByText(toCyrillic('Soʻrovni bekor qilish'))).toBeTruthy();
  });
});
