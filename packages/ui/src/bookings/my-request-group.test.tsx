import type { GrowthClient } from '@platform/api-client';
import { REQUEST_LINK } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { request } from './booking-test-kit';

afterEach(cleanup);

const open = (growth: Partial<GrowthClient>) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} link={{ name: REQUEST_LINK, id: request.id }} />,
    testClients({
      market: { myRequests: async () => [request] },
      bookings: { myBookings: async () => [], myOffers: async () => [] },
      growth,
    }),
  );

describe('«Tumaningiz guruhiga yuboring» (G69, docs/123 loop 2)', () => {
  it('with no offer yet, sends the request into the group of the district (G69, docs/123 loop 2)', async () => {
    const loopCard = vi.fn<GrowthClient['loopCard']>(async () => ({
      prepared: null,
      link: 'https://t.me/d?startapp=x',
      text: 'Yoʻlga chiqmoqchiman',
    }));
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const { tracked } = open({ loopCard });
    expect(await screen.findByText('Tumaningiz guruhiga yuboring')).toBeTruthy();
    expect(screen.getByText('Raqamingiz koʻrinmaydi.')).toBeTruthy();
    await tap('Guruhimga yuborish');
    await waitFor(() => expect(opened).toHaveBeenCalled());
    expect(loopCard).toHaveBeenCalledWith({ loop: 'req-share', requestId: request.id });
    expect(String(opened.mock.calls[0]?.[0])).toContain(encodeURIComponent('https://t.me/d?startapp=x'));
    const shares = tracked.filter((event) => event.name.startsWith('share_'));
    expect(shares).toMatchObject([
      { name: 'share_shown', button: 'req-share' },
      { name: 'share_done', button: 'req-share', target: 'chat' },
    ]);
    opened.mockRestore();
  });
});
