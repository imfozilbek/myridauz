import type { FeedbackClient } from '@platform/api-client';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ComplaintScreen } from './complaint-screen';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

// «Shikoyat» of the mockup g75/5 A: the question under the title, the ticks in one white card, the
// comment field, the words about who sees it; «Yuborish» once a tick is set.
describe('«Shikoyat» (G75, mockup g75/5 A, docs/17)', () => {
  it('asks under the title, ticks several reasons in one card and sends them in order', async () => {
    const complain = vi.fn<FeedbackClient['complain']>(async () => undefined);
    renderMarket(
      <ComplaintScreen bookingId="b1" onBack={() => undefined} />,
      testClients({ feedback: { complain } }),
    );
    expect(screen.getByText('Nima boʻldi? Bir nechtasini tanlash mumkin.')).toBeTruthy();
    expect(screen.queryByText('Batafsil')).toBeNull();
    const card = document.querySelector('.complaint-card');
    expect(card?.textContent).toContain('Xavfli haydash');
    expect(card?.textContent).toContain('Kelmadi');
    expect(screen.getByText('Kim shikoyat qilganini u koʻrmaydi.').className).toBe('complaint-note');
    expect(screen.queryByText('Yuborish')).toBeNull();
    await tap('Kelishilgandan koʻp pul soʻradi');
    await tap('Xavfli haydash');
    await tap('Yuborish');
    await waitFor(() =>
      expect(complain).toHaveBeenCalledWith({
        bookingId: 'b1',
        reasons: ['unsafe_driving', 'price_changed'],
        comment: '',
      }),
    );
  });
});
