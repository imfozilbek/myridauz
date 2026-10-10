import { ApiError, type SubscriptionsClient } from '@platform/api-client';
import type { Subscription } from '@platform/contracts';
import { cleanup, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { SubscriptionsLink } from './subscriptions-link';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

const EXPIRED: Subscription = {
  id: 's1',
  kind: 'trips',
  from: '1726269',
  to: '1730',
  date: null,
  woman: false,
  expiresAt: Date.parse('2026-10-31T12:00:00Z'),
  expired: true,
};
const offline = async (): Promise<never> => {
  throw new ApiError(0, 'network.failed');
};

describe('"Obunalar" says why a change did not work (G43, docs/65 B3)', () => {
  it('a renew that failed', async () => {
    window.history.replaceState(null, '', '/?subscriptions=1');
    renderMarket(
      <SubscriptionsLink>
        <p>Asosiy</p>
      </SubscriptionsLink>,
      testClients({ subscriptions: { mine: async () => [EXPIRED], renew: offline } }),
    );
    await tap('Uzaytirish');
    expect((await screen.findByRole('alert')).textContent).not.toBe('');
  });

  it('a «Qaytarish» that failed', async () => {
    window.history.replaceState(null, '', '/?subscriptions=1');
    let list = [EXPIRED];
    const remove = vi.fn<SubscriptionsClient['remove']>(async () => void (list = []));
    vi.stubGlobal('confirm', () => true);
    renderMarket(
      <SubscriptionsLink>
        <p>Asosiy</p>
      </SubscriptionsLink>,
      testClients({ subscriptions: { mine: async () => list, remove, subscribe: offline } }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Oʻchirish' }));
    await tap('Qaytarish');
    expect((await screen.findByRole('alert')).textContent).not.toBe('');
  });
});
