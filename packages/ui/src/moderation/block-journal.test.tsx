import type { ModerationClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { BlockJournal } from './block-journal';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const USER = '00000000000000000000000000000005';
const DAY = 24 * 60 * 60 * 1000;

// «Bloklar tarixi» of a person (docs/65 C): the block now, the blocks before, and the owner lifts one.
describe('the block journal of a person', () => {
  it('shows the block for good and why, and lifts it', async () => {
    const unblock = vi.fn<ModerationClient['unblock']>(async () => undefined);
    const clients = testClients({
      moderation: {
        blocks: async () => ({
          active: unblock.mock.calls.length > 0 ? null : { until: null },
          entries: [{ until: null, reason: 'complaint', by: 'Owner', at: 2 * DAY }],
        }),
        unblock,
      },
    });
    renderInShell(<BlockJournal userId={USER} />, false, true, undefined, clients);
    expect(await screen.findByText('Hozir butunlay bloklangan')).toBeTruthy();
    expect(screen.getByText('Shikoyat boʻyicha bloklangan')).toBeTruthy();
    vi.stubGlobal('confirm', () => true);
    fireEvent.click(screen.getByText('Blokdan chiqarish'));
    await vi.waitFor(() => expect(unblock).toHaveBeenCalledWith(USER));
    // Blocked before, not now: the journal does not say "never blocked".
    expect(await screen.findByText('Hozir bloklanmagan')).toBeTruthy();
  });
});
