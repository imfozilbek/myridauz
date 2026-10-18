import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ChannelReactions } from './channel-reactions';

afterEach(cleanup);

const row = (chat: string, topPost: { messageId: number; reactions: number } | null) => ({
  chat,
  title: `Kanal | ${chat}`,
  subscribers: 100,
  canPost: true,
  checkedAt: 1,
  failed: 0,
  arrivals: 0,
  joined: 0,
  left: 0,
  topPost,
});

// G87 V6 (docs/176): the best post of each channel this week, the most reactions first.
describe('the posts with the most reactions', () => {
  it('lists the best post of each channel and opens it in Telegram', () => {
    const channels = [
      row('-1004328825984', { messageId: 11, reactions: 7 }),
      row('@ch_kitob', { messageId: 3, reactions: 24 }),
      row('@ch_quiet', null),
    ];
    renderMarket(<ChannelReactions health={{ channels }} />, testClients({}));
    expect(screen.getByText('7 kunda koʻp reaksiya olgan postlar')).toBeTruthy();
    const most = screen.getByText('24 ta reaksiya');
    const fewer = screen.getByText('7 ta reaksiya');
    expect(most.compareDocumentPosition(fewer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/ch_quiet/u)).toBeNull();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(fewer);
    fireEvent.click(most);
    expect(open.mock.calls.map(([url]) => url)).toEqual([
      'https://t.me/c/4328825984/11',
      'https://t.me/ch_kitob/3',
    ]);
    open.mockRestore();
  });

  it('shows nothing in a week without reactions', () => {
    renderMarket(<ChannelReactions health={{ channels: [row('@ch_quiet', null)] }} />, testClients({}));
    expect(screen.queryByText('7 kunda koʻp reaksiya olgan postlar')).toBeNull();
  });
});
