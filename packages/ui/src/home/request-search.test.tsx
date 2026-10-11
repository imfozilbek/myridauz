import type { MarketClient } from '@platform/api-client';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../bookings/booking-test-kit';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// G79 П1 (docs/170): «Safar topish» of the open request opens the trips of its route and day at once;
// 3 … 5 taps → 1.
describe('«Safar topish» of an open request', { timeout: 20_000 }, () => {
  it('opens the trips of its route on its day', async () => {
    const open = { ...request, date: tashkentDate(Date.now() + DAY_MS) };
    const searchTrips = vi.fn<MarketClient['searchTrips']>(() => new Promise(() => undefined));
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
      bookings: async () => [],
      asked: async () => [open],
      market: { searchTrips },
    });
    expect(await screen.findByText('Soʻrovim')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Safar topish' }));
    await waitFor(() =>
      expect(searchTrips).toHaveBeenCalledWith(
        expect.objectContaining({ from: open.from, to: open.to, date: open.date }),
      ),
    );
    expect(screen.queryByText('Qayerga borasiz?')).toBeNull();
  });
});
