import type { MarketClient } from '@platform/api-client';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findRoute, searchMarket, weekOf } from '../find/search-test-kit';
import { testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { recommendation, renderMarket, tap } from './market-test-kit';
import { pickDay } from '../days/week-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('FindTripFlow: the days and the empty day (G59, docs/97 K2, K6)', { timeout: 20_000 }, () => {
  it('opens on today without any trip in the week, and a day of the chips opens its trips', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket([]), searchTrips } }),
    );
    await findRoute();
    // The row of the week (docs/172): today stands out, no dot without trips.
    await waitFor(() => expect(document.querySelectorAll('.week-day')).toHaveLength(7));
    expect(document.querySelector('.week-day[aria-pressed="true"]')?.textContent).toMatch(/^Bu\d/u);
    expect(document.querySelectorAll('.week-dot:not(.week-dot-none)')).toHaveLength(0);
    await pickDay(1);
    const tomorrow = weekOf([]).days[1]?.date;
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0].date).toBe(tomorrow));
    expect(document.querySelectorAll('.week-day')[1]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('leaves a request from an empty day with its route and day (K6)', async () => {
    const publishRequest = vi.fn<MarketClient['publishRequest']>(async () => {
      throw new Error('test.stop');
    });
    const recommend = async () => recommendation;
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({
        market: { ...searchMarket([]), searchTrips: async () => [], publishRequest, recommend },
        map: testMap(),
      }),
    );
    await findRoute();
    expect(await screen.findByText('Hozircha safar yoʻq')).toBeTruthy();
    await tap('Soʻrov qoldirish');
    // The route and the day come from the search: the one screen of the request at once (G61).
    expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
    expect(screen.queryByText('Qaysi kuni?')).toBeNull();
  });
});
