import type { Subscription } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { SubscriptionsScreen } from './subscriptions-screen';

afterEach(cleanup);

const REQUESTS: Subscription = {
  id: 's2',
  kind: 'requests',
  from: '1726269',
  to: '1730',
  date: null,
  woman: false,
  expiresAt: Date.parse('2026-10-31T12:00:00Z'),
  expired: false,
};

function open(app: 'driver' | 'passenger') {
  renderMarket(
    <AccountContext.Provider value={{ app } as unknown as Account}>
      <SubscriptionsScreen onBack={() => undefined} />
    </AccountContext.Provider>,
    testClients({ subscriptions: { mine: async () => [REQUESTS] } }),
  );
}

// «Obunalar» in the words of each side (G78 sheet 3): a driver waits for the requests on the route.
describe('"Obunalar" of a driver', () => {
  it('tells a driver about the new requests', async () => {
    open('driver');
    expect(
      await screen.findByText('Yoʻnalishingizda yangi soʻrov chiqsa, botda xabar beramiz.'),
    ).toBeTruthy();
  });

  it('tells a passenger about the new trips', async () => {
    open('passenger');
    expect(await screen.findByText('Yangi safar chiqsa, botda xabar beramiz.')).toBeTruthy();
  });
});
