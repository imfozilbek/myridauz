import type { MarketClient } from '@platform/api-client';
import type { RequestBoard } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap } from './market-test-kit';
import { RequestsLink } from './requests-link';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const empty: RequestBoard = {
  known: true,
  date: '2026-10-02',
  days: [],
  trip: null,
  fits: [],
  others: [],
  carSeats: 4,
  busy: false,
  notify: null,
};

const open = (link: string, enabled = true, address = `/?requests=${link}`) => {
  window.history.replaceState(null, '', address);
  const requestBoard = vi.fn<MarketClient['requestBoard']>(async () => empty);
  renderMarket(
    <RequestsLink enabled={enabled}>
      <p>Asosiy</p>
    </RequestsLink>,
    testClients({ market: { requestBoard } }),
  );
  return requestBoard;
};

// Several screens in one test: the first one loads TelegramUI, slow under coverage in CI.
describe('a new request on a followed route (docs/83 N08, G64)', { timeout: 20_000 }, () => {
  // G90 PAS-3, BOT-3: the bot button tapped days later opens today, not a board of a day that is over.
  it('opens today when the day of the button is over', async () => {
    vi.setSystemTime(Date.parse('2026-10-05T06:00:00Z'));
    const requestBoard = open('1726_1730_2026-10-02');
    await vi.waitFor(() => expect(requestBoard).toHaveBeenCalled(), { timeout: 5000 });
    expect(requestBoard.mock.calls[0]?.[0]).toMatchObject({ date: '2026-10-05' });
    vi.useRealTimers();
  });

  it('opens «Yoʻlovchilar soʻrovlari» of that route and day, back goes to the main screen', async () => {
    const requestBoard = open('1726_1730_2026-10-02');
    // The first screen of a file loads TelegramUI: under load it takes more than the default 1 s.
    await vi.waitFor(() => expect(requestBoard).toHaveBeenCalled(), { timeout: 5000 });
    expect(requestBoard.mock.calls[0]?.[0]).toEqual({
      from: '1726',
      to: '1730',
      date: '2026-10-02',
      seen: '1',
    });
    // The board is drawn first: «Orqaga» of the loading screen goes away with it, a tap there is lost.
    await screen.findByText('Bu kunga soʻrov yoʻq');
    await tap('Orqaga');
    expect(await screen.findByText('Asosiy')).toBeTruthy();
  });

  it('opens the day on the own directions when a place is unknown; the passenger app ignores the link', async () => {
    const requestBoard = open('9999_1730_2026-10-02');
    await vi.waitFor(() => expect(requestBoard).toHaveBeenCalledWith({ date: '2026-10-02', seen: '1' }), {
      timeout: 5000,
    });
    cleanup();
    open('1726_1730_2026-10-02', false);
    expect(screen.getByText('Asosiy')).toBeTruthy();
  });

  it('opens the request a passenger sent into the group of the district (G69, docs/123 loop 2)', async () => {
    const requestBoard = open(
      '',
      true,
      '/?tgWebAppStartParam=requests_1726_1730_2026-10-02__req-share-a1b2c3',
    );
    await vi.waitFor(() => expect(requestBoard).toHaveBeenCalled(), { timeout: 5000 });
    expect(requestBoard.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730', date: '2026-10-02' });
  });
});
