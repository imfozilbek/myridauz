import type { SubscriptionsClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DriverContext } from '../driver/driver-context';
import { approved } from '../home/home-test-kit';
import { recommendation, renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { board } from './board-test-kit';
import { RequestsFlow } from './requests-flow';

afterEach(cleanup);

const ROUTE = { from: '1726', to: '1718' };

// The market kit is the driver app.
function open(notify: typeof ROUTE | null) {
  const subscribe = vi.fn<SubscriptionsClient['subscribe']>(async (input) => ({
    ...input,
    id: 's1',
    kind: 'requests',
    expiresAt: Date.parse('2026-10-31T12:00:00Z'),
    expired: false,
  }));
  renderMarket(
    <DriverContext.Provider value={approved}>
      <RequestsFlow onBack={() => undefined} />
    </DriverContext.Provider>,
    testClients({
      market: {
        requestBoard: async () => board({ others: [], notify }),
        recommend: async () => recommendation,
      },
      subscriptions: { subscribe },
    }),
  );
  return subscribe;
}

// An empty day of the board (G78 sheet 3): the driver asks the bot to tell of a new request on the
// direction the server gives, in the words of a driver.
describe('«Xabar bering» on an empty board (G78 sheet 3)', () => {
  it('subscribes to the direction of the server for the day of the board', async () => {
    const subscribe = open(ROUTE);
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    expect(screen.getByText('Shu yoʻnalishda soʻrov chiqsa, bot xabar beradi')).toBeTruthy();
    await tap('Xabar bering');
    fireEvent.click(await screen.findByText('Shu kungi soʻrovlar'));
    await waitFor(() =>
      expect(subscribe).toHaveBeenCalledWith({ ...ROUTE, date: '2026-10-02', woman: false }),
    );
  });

  it('is not offered once a subscription covers every direction', async () => {
    open(null);
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    expect(screen.queryByText('Xabar bering')).toBeNull();
  });
});
