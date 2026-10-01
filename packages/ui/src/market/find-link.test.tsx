import type { MarketClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { FindLink } from './find-link';
import { renderMarket, tap } from './market-test-kit';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('a route from the landing (docs/59)', () => {
  it('opens the search at the day with the chosen route, then the list of that route', async () => {
    window.history.replaceState(null, '', '/#tgWebAppStartParam=find_1726_1730');
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(
      <FindLink enabled>
        <p>Asosiy</p>
      </FindLink>,
      testClients({ market: { searchTrips } }),
    );
    await tap(/^Bugun/);
    await vi.waitFor(() => expect(searchTrips).toHaveBeenCalled());
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730' });
    await tap('Orqaga');
    await tap('Orqaga');
    expect(await screen.findByText('Qayerdan ketasiz?')).toBeTruthy();
  });

  it('starts from the route when a place is unknown, and keeps the main screen without a link', async () => {
    window.history.replaceState(null, '', '/#tgWebAppStartParam=find_9999_1730');
    renderMarket(
      <FindLink enabled>
        <p>Asosiy</p>
      </FindLink>,
      testClients({}),
    );
    expect(await screen.findByText('Qayerdan ketasiz?')).toBeTruthy();
    cleanup();
    renderMarket(
      <FindLink enabled={false}>
        <p>Asosiy</p>
      </FindLink>,
      testClients({}),
    );
    expect(screen.getByText('Asosiy')).toBeTruthy();
  });
});
