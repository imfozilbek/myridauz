import { loadBrand } from '@platform/brands';
import type { Channel } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { ChannelsScreen } from './channels-screen';

afterEach(cleanup);

const [own] = loadBrand().channels;
const main: Channel = { chat: own?.chat ?? '', link: '', title: '', places: ['1710'], fixed: true };
const quiet: Channel = {
  chat: '@ch_kitob',
  link: '',
  title: 'Kanal | Kitob',
  places: ['1710224'],
  fixed: false,
};
const health = (
  chat: string,
  week: { joined: number; gone: number; reactions: number; topReactions: number },
) => ({
  chat,
  title: chat,
  subscribers: 1200,
  canPost: true,
  checkedAt: 1,
  failed: 0,
  arrivals: 0,
  ...week,
});

// G87 (docs/191): the owner sees the week of each channel: who joined and left, the reactions.
describe('the week of a channel in «Kanallar» of the owner', () => {
  it('says who joined and left and the reactions; a quiet week says nothing', async () => {
    const channels = { list: async () => [main, quiet] };
    const team = {
      channelHealth: async () => ({
        channels: [
          health(main.chat, { joined: 14, gone: 3, reactions: 37, topReactions: 12 }),
          health(quiet.chat, { joined: 0, gone: 0, reactions: 0, topReactions: 0 }),
        ],
      }),
    };
    const locations = { getLocations: async () => ({ version: '1', locations: [] }) };
    renderInShell(
      <ChannelsScreen onBack={() => undefined} />,
      false,
      true,
      locations,
      testClients({ channels, team }),
    );
    expect(
      await screen.findByText('Asosiy kanal · 7 kunda: 14 kirdi, 3 chiqdi · 37 reaksiya, eng koʻpi 12'),
    ).toBeTruthy();
    expect(screen.getByText('@ch_kitob · 1 ta joy')).toBeTruthy();
  });
});
