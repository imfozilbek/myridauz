import { ApiError, type BookingsClient } from '@platform/api-client';
import { cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// A seat that changed meanwhile: after the refusal the screen loads it again at once (G52, docs/112).
describe('a booking changed under the passenger', () => {
  it('loads the bookings again after bookings.wrong_status', async () => {
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () =>
      Promise.reject(new ApiError(409, 'bookings.wrong_status')),
    );
    const myBookings = vi.fn(async () => [confirmed]);
    vi.stubGlobal('confirm', () => true);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings, myOffers: async () => [], cancelMine },
      }),
    );
    await tap('Jasur');
    await tap('Joyni bekor qilish');
    await waitFor(() => expect(myBookings).toHaveBeenCalledTimes(2));
  });
});
