import { toCyrillic } from '@platform/i18n';
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
// a seat changed meanwhile opens as it is now.
describe('the cancel of a request just sent', { timeout: 20_000 }, () => {
  it('asks as the page of the seat and says why it did not go', async () => {
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () => {
      throw new ApiError(409, 'bookings.wrong_status');
    });
    // The driver answered meanwhile: the page of the seat comes as it is now (G52, docs/112).
    const myBookings = vi.fn<BookingsClient['myBookings']>(async () => [{ ...booking, status: 'declined' }]);
    const { onClose } = openBook('both', {}, undefined, { cancelMine, myBookings });
    expect(await screen.findByText(toCyrillic('Qayerdan, qayerga?'))).toBeTruthy();
    fireEvent.click(row(toCyrillic('Tushirish joyi')));
    await screen.findByText(toCyrillic('Yangi Margʻilon'), {}, { timeout: 3000 });
    await tap(toCyrillic('Shu yerda tushaman'));
    await tap(toCyrillic('Soʻrov yuborish'));
    expect(await screen.findByText(toCyrillic('Javob kutilmoqda'))).toBeTruthy();
    await tap(/бекор қилиш$/u);
    await waitFor(() => expect(cancelMine).toHaveBeenCalledWith(booking.id));
    expect(asked.confirm).toHaveBeenCalledWith(
      toCyrillic('Joyni bekor qilasizmi? Haydovchi bu haqda xabar oladi.'),
      toCyrillic('Joyni bekor qilish'),
    );
    await waitFor(() => expect(myBookings).toHaveBeenCalled());
    expect(await screen.findByText(toCyrillic('Haydovchi joy bera olmadi.'))).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  // G89 U3: the page of the request just sent follows the driver's answer (docs/64).
  it('shows the confirmed seat once the driver answers', async () => {
    const myBookings = vi.fn<BookingsClient['myBookings']>(async () => [{ ...booking, status: 'confirmed' }]);
    const { fire } = openBook('both', {}, undefined, { myBookings });
    expect(await screen.findByText(toCyrillic('Qayerdan, qayerga?'))).toBeTruthy();
    fireEvent.click(row(toCyrillic('Tushirish joyi')));
    await screen.findByText(toCyrillic('Yangi Margʻilon'), {}, { timeout: 3000 });
    await tap(toCyrillic('Shu yerda tushaman'));
    await tap(toCyrillic('Soʻrov yuborish'));
    expect(await screen.findByText(toCyrillic('Javob kutilmoqda'))).toBeTruthy();
    fire();
    await waitFor(() => expect(myBookings).toHaveBeenCalled());
    expect(await screen.findByText(toCyrillic('Joy tasdiqlandi'))).toBeTruthy();
  });
});
