import { toCyrillic } from '@platform/i18n';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FindTripFlow } from '../market/find-trip-flow';
import { renderMarket, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { findRoute, searchMarket } from './search-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const newDriver = { ...trip, driver: { ...trip.driver, rating: { average: null, count: 0 } } };

function open(trips = [trip]) {
  renderMarket(
    <FindTripFlow onBack={() => undefined} />,
    testClients({ market: { ...searchMarket([0, 3]), searchTrips: async () => trips } }),
  );
}

// Prod 16.11.2026 (G100): a passenger searching a whole region did not see where the driver leaves from,
// and «≈ 491 km · ≈ 8 soat» of the head argued with the times of the card.
describe('«Safarlar»: where the driver goes from and to (G100)', { timeout: 20_000 }, () => {
  it('a whole region: the card names both places, the head counts the trips of the week', async () => {
    open();
    await findRoute(true);
    expect(await screen.findByText(toCyrillic('Chilonzor → Fargʻona shahri'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Haftada 3 ta safar'))).toBeTruthy();
    expect(screen.queryByText(/≈ \d+ км · ≈ \d+ соат/u)).toBeNull();
  });

  it('district to district: the head keeps «≈ km · ≈ soat»', async () => {
    open();
    await findRoute();
    expect(await screen.findByText(toCyrillic('Chilonzor → Fargʻona shahri'))).toBeTruthy();
    expect(screen.getByText(/≈ \d+ км · ≈ \d+ соат/u)).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Haftada 3 ta safar'))).toBeNull();
  });

  it('a driver without reviews says «yangi», a driver with reviews his stars', async () => {
    open([newDriver]);
    await findRoute(true);
    expect(await screen.findByText(toCyrillic('yangi'))).toBeTruthy();
    expect(screen.queryByText(/★/u)).toBeNull();
    cleanup();
    open();
    await findRoute(true);
    expect(await screen.findByText(/^Jasur ★/u)).toBeTruthy();
    expect(screen.queryByText(toCyrillic('yangi'))).toBeNull();
  });
});
