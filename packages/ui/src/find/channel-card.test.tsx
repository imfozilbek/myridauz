import { loadBrand } from '@platform/brands';
import type { ChannelsClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { forgetAllLists } from '../screen/list-memory';
import { testClients } from '../test-shell';
import { ChannelCard } from './channel-card';

const [samarqand, buxoro] = loadBrand().channels;
const APP_LINK = 'https://t.me/+app_samarqand';
// The server made the link «Rida ilovasi» of the first channel, not yet of the second (docs/176).
const mine: ChannelsClient['mine'] = async () => [
  { chat: samarqand?.chat ?? '', member: false, link: APP_LINK },
  { chat: buxoro?.chat ?? '', member: false, link: buxoro?.link ?? '' },
];

afterEach(() => {
  cleanup();
  forgetAllLists();
});

async function join(channel: typeof samarqand, channels: Partial<ChannelsClient>) {
  if (!channel) throw new Error('the brand has no channels');
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  const onClose = vi.fn();
  renderMarket(
    <ChannelCard channel={channel} region={undefined} onClose={onClose} />,
    testClients({ channels }),
  );
  await vi.waitFor(() => expect(channels.mine).toHaveBeenCalled());
  // The answer of the server comes in.
  await act(() => new Promise((done) => setTimeout(done, 0)));
  fireEvent.click(screen.getByText('Kanalga qoʻshilish'));
  const opened = open.mock.calls[0]?.[0];
  open.mockRestore();
  expect(onClose).toHaveBeenCalledOnce();
  return opened;
}

// Owner decision 4 (docs/176): the card of the channel in the search and «Kutayotganda» opens the link
// of the app, so Telegram counts who joined from the app.
describe('the card of a channel (docs/119)', () => {
  it('joins by the own link of the app once the server gave it', async () => {
    expect(await join(samarqand, { mine: vi.fn(mine) })).toBe(APP_LINK);
  });

  it('joins by the link of the brand before the app link is made', async () => {
    expect(await join(buxoro, { mine: vi.fn(mine) })).toBe(buxoro?.link);
  });

  it('joins by the link of the brand when the server did not answer', async () => {
    const down = vi.fn<ChannelsClient['mine']>(async () => Promise.reject(new Error('offline')));
    expect(await join(samarqand, { mine: down })).toBe(samarqand?.link);
  });
});
