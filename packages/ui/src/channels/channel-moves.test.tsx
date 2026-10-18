import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ChannelMoves } from './channel-moves';

afterEach(cleanup);

const row = (chat: string, joined: number, left: number, subscribers: number | null) => ({
  chat,
  title: `Kanal | ${chat.slice(1)}`,
  subscribers,
  canPost: true,
  checkedAt: 1,
  failed: 0,
  arrivals: 0,
  joined,
  left,
});

// G87 V5 (docs/176): who came to a channel and left it this week, the busiest channel first.
describe('the joins and leaves of the channels', () => {
  it('lists the channels people came to or left, the busiest first, with their people', () => {
    const channels = [row('@quiet', 0, 0, 40), row('@small', 1, 0, null), row('@busy', 12, 3, 1250)];
    renderMarket(<ChannelMoves health={{ channels }} />, testClients({}));
    expect(screen.getByText('7 kunda kelgan va ketganlar')).toBeTruthy();
    const busy = screen.getByText('12 keldi · 3 ketdi');
    const small = screen.getByText('1 keldi · 0 ketdi');
    expect(busy.compareDocumentPosition(small) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('Kanal | quiet')).toBeNull();
    expect(screen.getByText(/^1\s?250$/u)).toBeTruthy();
  });

  it('shows nothing in a quiet week', () => {
    renderMarket(<ChannelMoves health={{ channels: [row('@quiet', 0, 0, 40)] }} />, testClients({}));
    expect(screen.queryByText('7 kunda kelgan va ketganlar')).toBeNull();
  });
});
