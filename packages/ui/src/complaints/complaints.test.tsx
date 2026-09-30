import type { FeedbackClient } from '@platform/api-client';
import type { Complaint } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ComplaintsScreen } from './complaints-screen';

afterEach(cleanup);

const party = (n: number, firstName: string, role: 'driver' | 'passenger') => ({
  id: n.toString(16).padStart(32, '0'),
  firstName,
  hasAvatar: false,
  role,
  trips: 12,
  complaints: 1,
});
const complaint = (id: string, reason: Complaint['reason'], high: boolean): Complaint => ({
  id,
  reason,
  high,
  comment: 'Qoʻpol gapirdi',
  status: 'new',
  createdAt: Date.parse('2026-10-05T08:00:00Z'),
  tripId: 't1',
  departAt: Date.parse('2026-10-04T03:30:00Z'),
  author: party(101, 'Madina', 'passenger'),
  against: party(1, 'Jasur', 'driver'),
});

describe('complaints of the team (docs/17)', () => {
  it('opens a complaint, shows the chat on demand and blocks for 7 days', async () => {
    const decide = vi.fn<FeedbackClient['decide']>(async () => undefined);
    const chat = vi.fn<FeedbackClient['chat']>(async () => [
      { author: '00000000000000000000000000000001', text: 'Tezroq chiq', at: 1 },
    ]);
    const clients = testClients({
      feedback: {
        queue: async () => [complaint('c1', 'harassment', true), complaint('c2', 'no_show', false)],
        complaint: async (id) => complaint(id, 'harassment', true),
        chat,
        decide,
      },
    });
    const { tracked } = renderMarket(<ComplaintsScreen onBack={() => undefined} />, clients);
    expect(await screen.findByText('Muhim')).toBeTruthy();
    await tap('Haqorat, tahdid yoki bezovta qilish');
    expect(await screen.findAllByText('12 ta safar, 1 ta shikoyat')).toHaveLength(2);
    expect(chat).not.toHaveBeenCalled();
    await tap('Chatni koʻrish');
    expect(await screen.findByText('Tezroq chiq')).toBeTruthy();
    await tap('7 kunga bloklash');
    await waitFor(() =>
      expect(decide).toHaveBeenCalledWith('c1', { action: 'block', days: 7, refund: false }),
    );
    expect(await screen.findByText('Qaror saqlandi')).toBeTruthy();
    expect(tracked.some((event) => event.name === 'complaint_decided')).toBe(true);
  });

  it('offers the commission back on a no-show and shows an empty queue', async () => {
    const decide = vi.fn<FeedbackClient['decide']>(async () => undefined);
    const clients = testClients({
      feedback: {
        queue: async () => [complaint('c2', 'no_show', false)],
        complaint: async (id) => complaint(id, 'no_show', false),
        decide,
      },
    });
    renderMarket(<ComplaintsScreen onBack={() => undefined} />, clients);
    await tap('Kelmadi');
    await tap('Haydovchiga komissiyani qaytarish');
    await tap('Ogohlantirish');
    await waitFor(() => expect(decide).toHaveBeenCalledWith('c2', { action: 'warning', refund: true }));
    cleanup();
    renderMarket(
      <ComplaintsScreen onBack={() => undefined} />,
      testClients({ feedback: { queue: async () => [] } }),
    );
    expect(await screen.findByText('Yangi shikoyat yoʻq')).toBeTruthy();
  });
});
