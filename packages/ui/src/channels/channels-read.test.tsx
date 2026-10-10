import type { Channel } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { ReadChannelsScreen } from './channels-screen';

afterEach(cleanup);

const kitob: Channel = { username: 'ch_kitob', title: 'Kanal | Kitob', places: ['1710224'], fixed: false };
const locations = {
  getLocations: async () => ({
    version: '1',
    locations: [
      {
        id: '1710224',
        parentId: null,
        type: 'region' as const,
        name: 'Kitob',
        lat: 39,
        lng: 66,
        oneCity: false,
      },
    ],
  }),
};

// A moderator reads the channels and changes nothing (owner decision 06.10.2026, docs/120): no
// «Kanal qoʻshish», no editing, no health of the owner.
describe('Kanallar of a moderator', () => {
  it('lists the channels to read only', async () => {
    const channelHealth = vi.fn(async () => ({ channels: [] }));
    const channels = { list: async () => [kitob] };
    const clients = testClients({ channels, team: { channelHealth } });
    renderInShell(<ReadChannelsScreen onBack={() => undefined} />, false, true, locations, clients);
    const row = await screen.findByText('Kanal | Kitob');
    expect(row.closest('button')).toBeNull();
    expect(screen.queryByText('Kanal qoʻshish')).toBeNull();
    expect(channelHealth).not.toHaveBeenCalled();
  });
});
