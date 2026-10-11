import type { BookingsClient } from '@platform/api-client';
import { DAY_MS } from '@platform/contracts';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

const asked = vi.hoisted(() => ({ confirm: vi.fn(async () => false) }));
vi.mock('../telegram/feedback', async (original) => ({
  ...(await original<typeof import('../telegram/feedback')>()),
  confirm: asked.confirm,
}));
afterEach(cleanup);

// One tap in the block never loses a seat: it is asked first, as on the page of the seat (docs/65 B4).
describe('«Bekor qilish» in the block of a passenger (G76)', { timeout: 20_000 }, () => {
  it('asks first: «No» keeps the seat, «Yes» cancels it', async () => {
    const seat = { ...booking, trip: { ...trip, departAt: Date.now() + DAY_MS } };
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () => ({
      ...seat,
      status: 'cancelled_by_passenger' as const,
    }));
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
      bookings: async () => [seat],
      answers: { cancelMine },
    });
    await tap('Bekor qilish');
    await vi.waitFor(() => expect(asked.confirm).toHaveBeenCalledOnce());
    expect(cancelMine).not.toHaveBeenCalled();
    asked.confirm.mockResolvedValueOnce(true);
    await tap('Bekor qilish');
    await vi.waitFor(() => expect(cancelMine).toHaveBeenCalledWith(seat.id));
    expect(asked.confirm).toHaveBeenCalledWith(
      'Joyni bekor qilasizmi? Haydovchi bu haqda xabar oladi.',
      'Joyni bekor qilish',
    );
  });
});
