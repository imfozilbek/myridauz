import { MINUTE_MS } from '@platform/contracts';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, wallet } from '../bookings/booking-test-kit';
import { DriverHome } from '../home/driver-home';
import { DRIVER_ACTIONS } from '../home/home-test-actions';
import { renderHome } from '../home/home-test-kit';
import { sheetClosed } from '../home/sheet-closed';
import { tap, trip } from '../market/market-test-kit';

// The answer of a driver is one code (G77 C3): the sheet of a new request answers through
// useAnswerBooking, as «Mening safarim» and the booking do. Here only who calls it.
const answered = vi.hoisted(() => vi.fn());
vi.mock('../bookings/use-answer-booking', () => ({
  useAnswerBooking:
    ({ screen }: { readonly screen: string }) =>
    async (seat: { readonly id: string }, action: string) =>
      answered(screen, seat.id, action),
}));

afterEach(cleanup);

// 10:00 the day before the trip of 08:00 in Toshkent.
const NOW = Date.parse('2026-10-01T05:00:00Z');

describe('the answer of a driver in the sheet, one way (G77 C3)', { timeout: 20_000 }, () => {
  it('«Tasdiqlash» of the sheet answers through useAnswerBooking', async () => {
    vi.setSystemTime(NOW);
    const asked = { ...booking, id: 'b8', expiresAt: NOW + 29.5 * MINUTE_MS };
    renderHome(() => <DriverHome />, DRIVER_ACTIONS, {
      trips: async () => [trip],
      requests: async () => [asked],
      sheet: true,
      wallet: async () => ({ ...wallet, bonus: 100_000, main: 0 }),
    });
    await tap('Javob berish');
    await tap('Tasdiqlash');
    expect(answered).toHaveBeenCalledWith('sheet', 'b8', 'confirm');
    await sheetClosed();
  });
});
