import type { FeedbackClient } from '@platform/api-client';
import { cleanup, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ComplaintScreen } from './complaint-screen';
import { showPlaque, usePlaque } from '../action-sheet/plaque';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

// «Shikoyat» of the mockup g75/5 A: the question under the title, the ticks in one white card, the
// comment field, the words about who sees it; «Yuborish» once a tick is set.
describe('«Shikoyat» (G75, mockup g75/5 A, docs/17)', () => {
  it('asks under the title, ticks several reasons in one card and sends them in order', async () => {
    const complain = vi.fn<FeedbackClient['complain']>(async () => undefined);
    const onSent = vi.fn();
    const { result: plaque } = renderHook(() => usePlaque());
    renderMarket(
      <ComplaintScreen bookingId="b1" onBack={() => undefined} onSent={onSent} />,
      testClients({ feedback: { complain } }),
    );
    expect(screen.getByText('Nima boʻldi? Bir nechtasini tanlash mumkin.')).toBeTruthy();
    expect(screen.queryByText('Batafsil')).toBeNull();
    const card = document.querySelector('.complaint-card');
    expect(card?.textContent).toContain('Xavfli haydash');
    expect(card?.textContent).toContain('Kelmadi');
    // All 8 reasons (owner decision 10.10.2026, docs/163 dispute 9).
    expect(card?.querySelectorAll('.tick-row')).toHaveLength(8);
    expect(card?.textContent).toContain('Spam yoki firibgarlik');
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
    // Sent, it closes by itself: back to where it came from, the plaque says so (G78 П16).
    await waitFor(() => expect(onSent).toHaveBeenCalledOnce());
    expect(plaque.current).toBe('Shikoyatingiz yuborildi. Moderator koʻrib chiqadi.');
    showPlaque(null);
  });

  // Q4 of docs/111 (G46): a passenger complains about the driver or about another passenger of the trip.
  it('lets a passenger name another passenger of the trip', async () => {
    const complain = vi.fn<FeedbackClient['complain']>(async () => undefined);
    const riders = vi.fn(async () => [{ id: 'p2', firstName: 'Bobur', hasAvatar: false }]);
    renderMarket(
      <ComplaintScreen
        bookingId="b1"
        onBack={() => undefined}
        onSent={() => undefined}
        passenger={{ driverName: 'Jasur' }}
      />,
      testClients({ feedback: { complain }, bookings: { riders } }),
    );
    expect(await screen.findByText('Kimdan shikoyat qilasiz?')).toBeTruthy();
    expect(screen.getByText('Jasur')).toBeTruthy();
    await tap('Bobur');
    await tap('Kelmadi');
    await tap('Yuborish');
    await waitFor(() =>
      expect(complain).toHaveBeenCalledWith({
        bookingId: 'b1',
        reasons: ['no_show'],
        comment: '',
        about: 'p2',
      }),
    );
    showPlaque(null);
  });
});
