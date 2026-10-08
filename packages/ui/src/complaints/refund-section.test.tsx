import type { FeedbackClient } from '@platform/api-client';
import type { Complaint, TeamRole } from '@platform/contracts';
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
  trips: 3,
  complaints: 0,
});
// «Kelmadi» of the driver: the moderator decided and proposed to give the commission back (docs/35).
const waiting: Complaint = {
  id: 'c7',
  reason: 'no_show',
  high: false,
  comment: '',
  status: 'resolved',
  createdAt: Date.parse('2026-10-05T08:00:00Z'),
  tripId: 't1',
  departAt: Date.parse('2026-10-04T03:30:00Z'),
  author: party(1, 'Jasur', 'driver'),
  against: party(101, 'Akmal', 'passenger'),
  refund: { state: 'proposed', amount: 9000 },
};

function open(
  role: TeamRole,
  answerRefund: FeedbackClient['answerRefund'] = async () => undefined,
  complaint = waiting,
) {
  const clients = testClients({
    feedback: { queue: async () => [complaint], complaint: async () => complaint, answerRefund },
    moderation: {
      me: async () => ({ firstName: 'Ali', role }),
      blocks: async () => ({ active: null, entries: [] }),
    },
  });
  return renderMarket(<ComplaintsScreen onBack={() => undefined} />, clients);
}

describe('the refund of a no-show in the admin app (docs/35, G63)', () => {
  it('the owner sees the sum and confirms the refund', async () => {
    const answerRefund = vi.fn<FeedbackClient['answerRefund']>(async () => undefined);
    const { tracked } = open('owner', answerRefund);
    await tap('Kelmadi');
    expect(await screen.findByText(/9\s000/u)).toBeTruthy();
    expect(screen.queryByText('Ogohlantirish')).toBeNull();
    await tap('Qaytarishni tasdiqlash');
    await waitFor(() => expect(answerRefund).toHaveBeenCalledWith('c7', 'confirm'));
    expect(await screen.findByText('Qaror saqlandi')).toBeTruthy();
    expect(tracked.some((event) => event.name === 'complaint_decided')).toBe(true);
  });

  it('the owner may refuse the refund', async () => {
    const answerRefund = vi.fn<FeedbackClient['answerRefund']>(async () => undefined);
    open('owner', answerRefund);
    await tap('Kelmadi');
    await tap('Qaytarmaslik');
    await waitFor(() => expect(answerRefund).toHaveBeenCalledWith('c7', 'reject'));
  });

  it('a moderator sees that it waits for the owner, without the buttons', async () => {
    open('moderator');
    await tap('Kelmadi');
    expect(await screen.findByText('Loyiha egasi tasdiqlashini kutmoqda.')).toBeTruthy();
    expect(screen.queryByText('Qaytarishni tasdiqlash')).toBeNull();
  });

  it('a refund answered already shows how, without the buttons', async () => {
    open('owner', undefined, { ...waiting, refund: { state: 'confirmed', amount: 9000 } });
    await tap('Kelmadi');
    expect(await screen.findByText('Komissiya haydovchiga qaytarildi.')).toBeTruthy();
    expect(screen.queryByText('Qaytarmaslik')).toBeNull();
    cleanup();
    open('owner', undefined, { ...waiting, refund: { state: 'rejected', amount: 9000 } });
    await tap('Kelmadi');
    expect(await screen.findByText('Loyiha egasi qaytarmaslikka qaror qildi.')).toBeTruthy();
  });
});
