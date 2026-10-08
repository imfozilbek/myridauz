import type { Complaint } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pullDown, rows, scrolledTo, skeleton } from '../market/list-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ComplaintsScreen } from './complaints-screen';

afterEach(cleanup);

const person = { id: '00000000000000000000000000000001', hasAvatar: false, trips: 1, complaints: 0 };
const complaint = (id: string, reason: Complaint['reason']): Complaint => ({
  id,
  reason,
  high: false,
  comment: 'Kelmadi',
  status: 'new',
  createdAt: 1,
  tripId: 't1',
  departAt: 1,
  author: { ...person, firstName: 'Madina', role: 'passenger' },
  against: { ...person, firstName: 'Jasur', role: 'driver' },
  refund: null,
});

describe('The queue of complaints (docs/94 F2, S3, W1)', () => {
  it('back from a complaint: the same rows at the same place, refreshed quietly', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');
    const queue = vi.fn(async () => [complaint('c1', 'no_show'), complaint('c2', 'harassment')]);
    renderMarket(
      <ComplaintsScreen onBack={() => undefined} />,
      testClients({ feedback: { queue, complaint: async () => complaint('c2', 'harassment') } }),
    );
    await screen.findByText('Haqorat, tahdid yoki bezovta qilish');
    // How many wait, in the header (G41, docs/90 F-A4).
    expect(screen.getByText('Navbatda: 2')).toBeTruthy();
    scrolledTo(400);
    await tap('Haqorat, tahdid yoki bezovta qilish');
    await screen.findByText('Shikoyat qilingan');
    await tap('Orqaga');
    expect(skeleton()).toBeNull();
    expect(rows()).toEqual(['c1', 'c2']);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 400);
    await waitFor(() => expect(queue).toHaveBeenCalledTimes(2));
    await pullDown();
    expect(queue).toHaveBeenCalledTimes(3);
  });
});
