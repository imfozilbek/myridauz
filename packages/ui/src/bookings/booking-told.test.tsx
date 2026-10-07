import { ApiError, type ChatClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { TRIP_DAY, confirmed } from './booking-test-kit';

afterEach(cleanup);

describe('«Yaqinlarim» says why a step did not work (G43, docs/65 B3)', () => {
  it('shows the reason under the tools', async () => {
    vi.setSystemTime(TRIP_DAY);
    const boarded = vi.fn<ChatClient['boarded']>(async () => {
      throw new ApiError(409, 'shares.wrong_status');
    });
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [] },
        chat: { boarded },
      }),
    );
    await tap('Jasur');
    await tap('Mashinaga chiqdim');
    expect((await screen.findByRole('alert')).textContent).not.toBe('');
  });
});
