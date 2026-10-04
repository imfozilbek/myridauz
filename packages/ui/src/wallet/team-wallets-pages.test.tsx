import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { TeamWalletsScreen } from './team-wallets-screen';

afterEach(cleanup);

const owner = (firstName: string, id: string) => ({ driverId: id.repeat(32), firstName, bonus: 0, main: 0 });

// «Hamyonlar» comes by pages of 30 (G42): the next page only when the team asks for it.
describe('"Hamyonlar" by pages', () => {
  it('shows the first page and adds the next one on «Yana koʻrsatish»', async () => {
    const all = vi.fn(async (page = 0) =>
      page === 0
        ? { wallets: [owner('Jasur', '7')], more: true }
        : { wallets: [owner('Bobur', '8')], more: false },
    );
    renderMarket(<TeamWalletsScreen onBack={() => undefined} />, testClients({ wallet: { all } }));
    expect(await screen.findByText('Jasur')).toBeTruthy();
    expect(screen.queryByText('Bobur')).toBeNull();
    await tap('Yana koʻrsatish');
    expect(await screen.findByText('Bobur')).toBeTruthy();
    expect(screen.queryByText('Yana koʻrsatish')).toBeNull();
    expect(all).toHaveBeenLastCalledWith(1);
  });
});
