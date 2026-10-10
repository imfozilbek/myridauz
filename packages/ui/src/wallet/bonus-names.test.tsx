import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { approved } from '../account/profile/profile-test-kit';
import { DriverContext } from '../driver/driver-context';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { WALLET_ACTION } from './wallet-flow';

afterEach(cleanup);

const { Screen: WalletFlow } = WALLET_ACTION;
const [, first] = wallet.operations;
if (!first) throw new Error('the kit has a bonus second');
const grant = (id: string, month: number) => ({
  ...first,
  id,
  kind: 'bonus_grant' as const,
  createdAt: Date.parse('2026-10-01T02:00:00Z') + month * 30 * 86_400_000,
});

// Three bonuses of the promotion are told apart in «Tarix» (G75, docs/158 Г): the first keeps its
// name of the mockup g65/1, the next ones say their month.
describe('the bonuses in «Tarix» of «Hamyon»', () => {
  it('names the second and the third bonus by their month', async () => {
    const three = { ...wallet, operations: [grant('w4', 2), grant('w3', 1), ...wallet.operations] };
    renderMarket(
      <DriverContext.Provider value={approved}>
        <WalletFlow onBack={() => undefined} />
      </DriverContext.Provider>,
      testClients({ wallet: { mine: async () => three } }),
    );
    expect(await screen.findByText('Boshlash bonusi')).toBeTruthy();
    expect(screen.getByText('2-oy bonusi')).toBeTruthy();
    expect(screen.getByText('3-oy bonusi')).toBeTruthy();
  });
});
