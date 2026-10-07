import type { MarketClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchMarket } from '../find/search-test-kit';
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
      testClients({ market: { ...searchMarket([]), searchTrips } }),
    );
    // K2: the trips of the nearest day at once, no day screen.
    // The first screen of a file loads TelegramUI: under load it takes more than the default 1 s.
    await vi.waitFor(() => expect(searchTrips).toHaveBeenCalled(), { timeout: 5000 });
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730' });
    await screen.findByText('Hozircha safar yoʻq');
    await tap('Orqaga');
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
  });

  it('opens the trips of the route and the day from a bot button (docs/89 S10)', async () => {
    window.history.replaceState(null, '', '/?find=1726_1730_2026-10-03');
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(
      <FindLink enabled>
        <p>Asosiy</p>
      </FindLink>,
      testClients({ market: { ...searchMarket([]), searchTrips } }),
    );
    await vi.waitFor(() => expect(searchTrips).toHaveBeenCalled(), { timeout: 5000 });
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730', date: '2026-10-03' });
  });

  it('starts from the route when a place is unknown, and keeps the main screen without a link', async () => {
    window.history.replaceState(null, '', '/#tgWebAppStartParam=find_9999_1730');
    renderMarket(
      <FindLink enabled>
        <p>Asosiy</p>
      </FindLink>,
      testClients({}),
    );
    // K1: the list of «Qayerdan» opens at once.
    expect(await screen.findByText('Qayerdan yoʻlga chiqasiz?')).toBeTruthy();
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
