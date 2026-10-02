import type { MarketClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap } from './market-test-kit';
import { RequestsLink } from './requests-link';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

// Several screens in one test: the first one loads TelegramUI, slow under coverage in CI.
describe('a new request on a followed route (docs/83 N08)', { timeout: 20_000 }, () => {
  it('opens the requests of that route and day, back goes to the day', async () => {
    window.history.replaceState(null, '', '/?requests=1726_1730_2026-10-02');
    const searchRequests = vi.fn<MarketClient['searchRequests']>(async () => []);
    renderMarket(
      <RequestsLink enabled>
        <p>Asosiy</p>
      </RequestsLink>,
      testClients({ market: { searchRequests } }),
    );
    // The first screen of a file loads TelegramUI: under load it takes more than the default 1 s.
    await vi.waitFor(() => expect(searchRequests).toHaveBeenCalled(), { timeout: 5000 });
    expect(searchRequests.mock.calls[0]?.[0]).toEqual({ from: '1726', to: '1730', date: '2026-10-02' });
    // The list is drawn first: «Orqaga» of the loading screen goes away with it, a tap there is lost.
    await screen.findByText('Bu kunga soʻrov yoʻq');
    // Back is the day, then the route: another day is one tap away.
    await tap('Orqaga');
    expect(await screen.findByText(/^Bugun/)).toBeTruthy();
  });

  it('starts from the route when a place is unknown; the passenger app ignores the link', async () => {
    window.history.replaceState(null, '', '/?requests=9999_1730_2026-10-02');
    renderMarket(
      <RequestsLink enabled>
        <p>Asosiy</p>
      </RequestsLink>,
      testClients({}),
    );
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
    cleanup();
    renderMarket(
      <RequestsLink enabled={false}>
        <p>Asosiy</p>
      </RequestsLink>,
      testClients({}),
    );
    expect(screen.getByText('Asosiy')).toBeTruthy();
  });
});
