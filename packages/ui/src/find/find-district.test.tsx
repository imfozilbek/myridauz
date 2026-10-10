import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { FindTripFlow } from '../market/find-trip-flow';
import { testClients } from '../test-shell';
import { findRoute, searchMarket } from './search-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// «Samarqandning qaysi joyi?» (G75, mockup g75/6 A): the whole region in its own card, then each
// place with the trips of the week that go there, the busiest first.
describe('the places of a region with their trips', () => {
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
});
