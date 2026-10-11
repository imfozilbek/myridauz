import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { tap } from '../market/market-test-kit';
import { board, openBoard } from './board-test-kit';

afterEach(cleanup);

// G79 В7 (docs/170): the board opened with its route (the block of the main screen, a bot link)
// publishes on it from an empty day, the route is not asked again: 6 taps → 1.
describe('«Safar eʼlon qilish» on an empty day of a board with its route', { timeout: 20_000 }, () => {
  it('takes the route of the board', async () => {
    openBoard({ board: { from: '1726269', to: '1730401' }, requestBoard: async () => board({ others: [] }) });
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    await tap('Safar eʼlon qilish');
    expect(await screen.findByText('Chilonzor, Toshkent shahri')).toBeTruthy();
    expect(screen.getByText('Mashinada 4 joy')).toBeTruthy();
  });

  it('a whole region of the board is asked again, «Qayerdan» stays', async () => {
    openBoard({ board: { from: '1726269', to: '1730' }, requestBoard: async () => board({ others: [] }) });
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    await tap('Safar eʼlon qilish');
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
  });
});
