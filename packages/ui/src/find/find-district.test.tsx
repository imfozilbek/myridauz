import type { MarketClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { FindTripFlow } from '../market/find-trip-flow';
import { testClients } from '../test-shell';
import { findRoute, searchMarket, weekOf } from './search-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// «Samarqandning qaysi joyi?» (G75, mockup g75/6 A): the whole region in its own card, then each
// place with the trips of the week that go there, the busiest first.
describe('the places of a region with their trips', { timeout: 20_000 }, () => {
  it('counts the week on «Butun viloyat» and on each place', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket([0, 3, 1]), searchTrips: async () => [] } }),
    );
    await findRoute(true);
    await tap('Fargʻonaning qaysi joyi? Tuman tanlash');
    expect(await screen.findByText('Fargʻonaning qaysi joyi?')).toBeTruthy();
    const whole = document.querySelector('.district-whole');
    expect(whole?.textContent).toBe('Butun viloyat4 ta safar');
    const rows = [...document.querySelectorAll('.district-row')].map((row) => row.textContent);
    expect(rows).toEqual(['Fargʻona shahri4 ta safar']);
  });

  // G79 П15 (docs/170): a district chosen keeps the day of the results, 1 tap → 0.
  it('keeps the chosen day once a district is chosen', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket([0, 3, 1]), searchTrips } }),
    );
    await findRoute(true);
    // The third day, not the first day with trips that a new search opens on.
    fireEvent.click((await screen.findAllByRole('tab'))[2] as HTMLElement);
    const third = weekOf([0, 3, 1]).days[2]?.date;
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0].date).toBe(third));
    await tap('Fargʻonaning qaysi joyi? Tuman tanlash');
    await tap('Fargʻona shahri');
    await waitFor(() => expect(screen.getAllByRole('tab')[2]?.getAttribute('aria-selected')).toBe('true'));
    expect(searchTrips.mock.calls.at(-1)?.[0].date).toBe(third);
  });
});
