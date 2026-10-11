import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request } from '../bookings/booking-test-kit';
import { quickRoute, ROUTE, tap } from './market-test-kit';
import { openRequest } from './request-test-kit';
import { tomorrow } from './when';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

// G79 П10 (docs/170): a request already open on the route and the day opens at once, not after
// the points, the people and the price (6 … 8 taps → 1); «Назад» comes back to the day.
describe('a second request on the same route and day', { timeout: 20_000 }, () => {
  it('opens «Mening soʻrovim» right after the day', async () => {
    const open = { ...request, from: ROUTE.from.id, to: ROUTE.to.id, date: tomorrow(Date.now()) };
    const publishRequest = openRequest({ shared: true, mine: { myRequests: async () => [open] } });
    await quickRoute();
    await tap(/^Ertaga/);
    expect(await screen.findByText('Soʻrovni bekor qilish')).toBeTruthy();
    expect(screen.queryByText('Qayerdan, qayerga?')).toBeNull();
    await tap('Orqaga');
    expect(await screen.findByText(/^Ertaga/)).toBeTruthy();
    expect(publishRequest).not.toHaveBeenCalled();
  });

  it('from an empty day of the search it opens at once, «Назад» goes back to the search', async () => {
    const onBack = vi.fn();
    const open = { ...request, from: ROUTE.from.id, to: ROUTE.to.id, date: '2030-01-02' };
    openRequest({
      onBack,
      shared: true,
      search: { route: ROUTE, date: '2030-01-02' },
      mine: { myRequests: async () => [open] },
    });
    expect(await screen.findByText('Soʻrovni bekor qilish')).toBeTruthy();
    await tap('Orqaga');
    expect(onBack).toHaveBeenCalledOnce();
  });
});
