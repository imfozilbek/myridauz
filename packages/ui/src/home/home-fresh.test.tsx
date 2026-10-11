import { DAY_MS } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);

// The person's own step sends no signal (G77, lesson 230): back on the main screen its lists refresh,
// the block never shows a seat cancelled meanwhile.
describe('the main screen shown again', { timeout: 20_000 }, () => {
  it('refreshes its lists quietly', async () => {
    const seat = { ...booking, trip: { ...trip, departAt: Date.now() + DAY_MS } };
    const myBookings = vi.fn().mockResolvedValueOnce([seat]).mockResolvedValue([]);
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: myBookings });
    expect(await screen.findByText('Bekor qilish')).toBeTruthy();
    await tap('Rasm qoʻshing');
    await tap('Orqaga');
    await waitFor(() => expect(myBookings).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Bekor qilish')).toBeNull());
  });
});
