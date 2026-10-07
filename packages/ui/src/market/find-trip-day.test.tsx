import type { MarketClient } from '@platform/api-client';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findRoute, searchMarket, weekOf } from '../find/search-test-kit';
import { testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { recommendation, renderMarket, tap } from './market-test-kit';

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
    expect(await screen.findByRole('tab', { name: /Bugun\s*0 ta/u, selected: true })).toBeTruthy();
    // Seven days, the third one by its date.
    expect(screen.getAllByRole('tab')).toHaveLength(7);
    await tap('Ertaga');
    const tomorrow = weekOf([]).days[1]?.date;
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0].date).toBe(tomorrow));
    expect(screen.getByRole('tab', { name: /Ertaga/u, selected: true })).toBeTruthy();
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
    // The route and the day come from the search: the way of the pickup is the next question.
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    expect(screen.queryByText('Qaysi kuni?')).toBeNull();
  });
});
