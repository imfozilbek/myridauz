import type { ModerationClient } from '@platform/api-client';
import type { ApplicationSummary } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { ApplicationsScreen } from './applications-screen';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const USER = '00000000000000000000000000000005';
const application: ApplicationSummary = {
  userId: USER,
  firstName: 'Ali',
  status: 'pending',
  car: { make: 'Chevrolet', model: 'Nexia', color: 'white', plate: '10123ABC', seats: 4 },
  reasons: [],
  submittedAt: 1,
};

describe('what the team sees about a person (docs/65 C)', () => {
  it('shows earlier decisions, the same plate elsewhere, the block journal, and lifts a block', async () => {
    const DAY = 24 * 60 * 60 * 1000;
    const unblock = vi.fn<ModerationClient['unblock']>(async () => undefined);
    const clients = testClients({
      moderation: {
        queue: async () => [application],
        // The photos are not what this test looks at.
        photo: async () => Promise.reject(new Error('no photo')),
        get: async () => ({
          ...application,
          history: [{ status: 'rejected', reasons: [], at: DAY }],
          samePlate: 2,
        }),
        blocks: async () => ({
          active: { until: null },
          entries: [{ until: null, reason: 'complaint', by: 'Owner', at: 2 * DAY }],
        }),
        unblock,
      },
    });
    renderInShell(<ApplicationsScreen onBack={() => undefined} />, false, true, undefined, clients);
    fireEvent.click(await screen.findByText('Ali'));
    expect(
      await screen.findByText('Bu davlat raqami yana 2 kishining arizasida bor. Tekshiring.'),
    ).toBeTruthy();
    expect(screen.getByText('Rad etilgan')).toBeTruthy();
    expect(await screen.findByText('Hozir butunlay bloklangan')).toBeTruthy();
    expect(screen.getByText('Shikoyat boʻyicha bloklangan')).toBeTruthy();
    vi.stubGlobal('confirm', () => true);
    fireEvent.click(screen.getByText('Blokdan chiqarish'));
    await vi.waitFor(() => expect(unblock).toHaveBeenCalledWith(USER));
  });
});
