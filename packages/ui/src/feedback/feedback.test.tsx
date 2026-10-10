import { ApiError, type FeedbackClient } from '@platform/api-client';
import type { ReviewTarget } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FeedbackLink } from './feedback-link';
import { RatingBadge } from './rating-badge';
import { haptic } from '../telegram/feedback';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const TARGET: ReviewTarget = {
  rateeId: '00000000000000000000000000000007',
  rateeName: 'Jasur',
  rateeRole: 'driver',
  mine: { stars: 2, tags: [], text: '' },
};
const open = (param: string, feedback: Partial<FeedbackClient>) => {
  window.history.replaceState(null, '', `/?${param}=b1`);
  return renderMarket(
    <FeedbackLink enabled>
      <p>Asosiy</p>
    </FeedbackLink>,
    testClients({ feedback }),
  );
};

describe('ratings and reviews in the Mini App (docs/24)', () => {
  it('shows "Yangi" below 3 ratings and "4,8 (37)" after', () => {
    renderMarket(<RatingBadge rating={{ average: null, count: 2 }} />, testClients({}));
    expect(screen.getByText('Yangi')).toBeTruthy();
    cleanup();
    renderMarket(<RatingBadge rating={{ average: 4.8, count: 37 }} />, testClients({}));
    expect(screen.getByText(/4,8/u).textContent?.replace(/\s/gu, ' ')).toBe('4,8 (37)');
  });

  it('opens the review from the bot, keeps the stars, sends tags and text', async () => {
    const review = vi.fn<FeedbackClient['review']>(async () => undefined);
    const { tracked } = open('review', { target: async () => TARGET, review });
    expect(await screen.findByText('Jasur')).toBeTruthy();
    const select = vi.spyOn(haptic, 'select');
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    // Each tag is a chip: several can be chosen, seen before a tap (docs/88 L9, mockup g60/5).
    await tap('Vaqtida');
    expect(screen.getByRole('button', { name: 'Vaqtida' }).getAttribute('aria-pressed')).toBe('true');
    // Each choice ticks softly, like Telegram's own lists (docs/88 L3).
    expect(select).toHaveBeenCalledTimes(2);
    // The comment opens by «+ Izoh yozish»; a text of several lines shows all of it (docs/88 L2).
    await tap('+ Izoh yozish');
    expect(screen.getByPlaceholderText(/qisqacha/u).tagName).toBe('TEXTAREA');
    fireEvent.change(screen.getByPlaceholderText(/qisqacha/u), { target: { value: 'Yaxshi yoʻl' } });
    await tap('Yuborish');
    await waitFor(() => expect(review).toHaveBeenCalledOnce());
    expect(review).toHaveBeenCalledWith({
      bookingId: 'b1',
      stars: 4,
      tags: ['on_time'],
      text: 'Yaxshi yoʻl',
    });
    // No screen after sending (G60): the bot opened it, so the app closes.
    await waitFor(() => expect(tracked.some((event) => event.name === 'review_sent')).toBe(true));
    expect(screen.queryByText(/Bahongiz saqlandi/u)).toBeNull();
  });

  it('goes from the review to a complaint and explains a second one', async () => {
    const complain = vi.fn<FeedbackClient['complain']>(async () => undefined);
    open('review', { target: async () => TARGET, complain });
    await tap('Shikoyat');
    // Several reasons as ticks (owner decision 10.10.2026): a second tap takes one back.
    await tap('Kelmadi');
    await tap('Boshqa');
    await tap('Kelishilgandan koʻp pul soʻradi');
    await tap('Boshqa');
    expect(screen.getByPlaceholderText(/Nima boʻlganini/u).tagName).toBe('TEXTAREA');
    await tap('Yuborish');
    await waitFor(() =>
      expect(complain).toHaveBeenCalledWith({
        bookingId: 'b1',
        reasons: ['no_show', 'price_changed'],
        comment: '',
      }),
    );
    expect(await screen.findByText(/Moderator koʻrib chiqadi/u)).toBeTruthy();
    cleanup();
    open('complain', { complain: async () => Promise.reject(new ApiError(409, 'complaints.already')) });
    await tap('Boshqa');
    await tap('Yuborish');
    expect(await screen.findByText(/allaqachon yuborilgan/u)).toBeTruthy();
  });
});
