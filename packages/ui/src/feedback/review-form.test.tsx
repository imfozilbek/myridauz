import { toCyrillic } from '@platform/i18n';
import { ApiError, type ComfortClient, type FeedbackClient } from '@platform/api-client';
import { NOBODY_ID, type ReviewTarget } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ReviewScreen } from './review-screen';

afterEach(cleanup);

const TARGET: ReviewTarget = {
  rateeId: '00000000000000000000000000000007',
  rateeName: 'Jasur',
  rateeRole: 'driver',
  mine: null,
};
const done = { ...confirmed, status: 'completed' as const };

function open(feedback: Partial<FeedbackClient>, comfort: Partial<ComfortClient> = {}, target = TARGET) {
  const onBack = vi.fn();
  renderMarket(
    <ReviewScreen bookingId={done.id} onBack={onBack} onComplain={() => undefined} />,
    testClients({
      feedback: { target: async () => target, ...feedback },
      chat: {
        about: async () => ({ booking: done, role: 'passenger', request: null, offer: null, driver: null }),
      },
      comfort: { favorites: async () => ({ drivers: [], trips: [] }), ...comfort },
    }),
  );
  return onBack;
}

describe('the review (G60, mockup g60/5): one short screen', () => {
  it('shows the driver and the one trip card, stars, tags as chips, the comment behind a link', async () => {
    open({});
    // After the trip the card shows the road between the ends (mockup g60/6).
    expect(await screen.findByText(/соат йўл$/u)).toBeTruthy();
    expect(screen.queryByText(toCyrillic('2 joy'))).toBeNull();
    expect(screen.getByText(toCyrillic('Safar qanday oʻtdi?'))).toBeTruthy();
    expect(screen.getByRole('button', { name: toCyrillic('Vaqtida') })).toBeTruthy();
    expect(screen.queryByPlaceholderText(/Сафар ҳақида/u)).toBeNull();
    await tap(toCyrillic('+ Izoh yozish'));
    expect(screen.getByPlaceholderText(/Сафар ҳақида/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Sevimli haydovchi'))).toBeTruthy();
  });

  it('sends and goes back at once: no screen after sending', async () => {
    const review = vi.fn<FeedbackClient['review']>(async () => undefined);
    const onBack = open({ review });
    fireEvent.click(await screen.findByRole('button', { name: '5' }));
    await tap(toCyrillic('Vaqtida'));
    await tap(toCyrillic('Yuborish'));
    await vi.waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(review).toHaveBeenCalledWith({ bookingId: done.id, stars: 5, tags: ['on_time'], text: '' });
    expect(screen.queryByText(toCyrillic('Rahmat. Bahongiz saqlandi.'))).toBeNull();
  });

  // G89 A7: a review that shows keeps its stars; the person reads why, not «Xatolik».
  it('says the review is published and cannot change', async () => {
    const review = async () => Promise.reject(new ApiError(409, 'reviews.published'));
    open({ review });
    fireEvent.click(await screen.findByRole('button', { name: '1' }));
    await tap(toCyrillic('Yuborish'));
    expect(
      await screen.findByText(toCyrillic('Baho eʼlon qilindi. Endi uni oʻzgartirib boʻlmaydi.')),
    ).toBeTruthy();
  });

  it('saves the driver as a favourite by the switch', async () => {
    const save = vi.fn<ComfortClient['save']>(async () => undefined);
    open({}, { save });
    fireEvent.click(await screen.findByRole('checkbox', { name: toCyrillic('Sevimli haydovchi') }));
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith(TARGET.rateeId));
  });

  // G89 M9: a driver who deleted the account is nobody to save.
  it('offers no «Sevimli haydovchi» for a deleted driver', async () => {
    open({}, {}, { ...TARGET, rateeId: NOBODY_ID });
    expect(await screen.findByText(toCyrillic('Safar qanday oʻtdi?'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Sevimli haydovchi'))).toBeNull();
  });
});
