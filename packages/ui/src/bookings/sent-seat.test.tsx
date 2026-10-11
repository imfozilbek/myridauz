import { ApiError, type BookingsClient } from '@platform/api-client';
import { booking } from './booking-test-kit';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { openBook, row } from './book-flow-test-kit';

const asked = vi.hoisted(() => ({ confirm: vi.fn(async () => true) }));
vi.mock('../telegram/feedback', async (original) => ({
  ...(await original<typeof import('../telegram/feedback')>()),
  confirm: asked.confirm,
}));
afterEach(cleanup);
beforeEach(() => localStorage.clear());

// The request just sent is cancelled as on the page of the seat (G77): the same question, counted,
// a failure says why and keeps the screen.
describe('the cancel of a request just sent', { timeout: 20_000 }, () => {
  it('asks as the page of the seat and says why it did not go', async () => {
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () => {
      throw new ApiError(409, 'bookings.wrong_status');
    });
    const { onClose } = openBook('both', {}, undefined, { cancelMine });
    expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
    fireEvent.click(row('Tushirish joyi'));
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda tushaman');
    await tap('Soʻrov yuborish');
    expect(await screen.findByText('Javob kutilmoqda')).toBeTruthy();
    await tap(/bekor qilish$/u);
    await waitFor(() => expect(cancelMine).toHaveBeenCalledWith(booking.id));
    expect(asked.confirm).toHaveBeenCalledWith(
      'Joyni bekor qilasizmi? Haydovchi bu haqda xabar oladi.',
      'Joyni bekor qilish',
    );
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
