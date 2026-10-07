import { DAY_MS, MINUTE_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { SearchTripCard } from './search-trip-card';

afterEach(cleanup);

describe('a trip in «Safarlar» (G59, G39)', () => {
  it('leads with «Tez orada joʻnaydi» and «Narxi tushdi»', () => {
    const changed = { ...trip, departAt: Date.now() + 30 * MINUTE_MS, price: 80000, firstPrice: 95000 };
    renderMarket(<SearchTripCard trip={changed} places={null} onOpen={() => undefined} />, testClients({}));
    expect(screen.getByText('Tez orada joʻnaydi')).toBeTruthy();
    expect(screen.getByText('Narxi tushdi')).toBeTruthy();
  });

  it('says the whole car and its price on a trip that sells it', () => {
    renderMarket(
      <SearchTripCard
        trip={{ ...trip, departAt: Date.now() + DAY_MS, bookingRule: 'seats_or_car' }}
        places={null}
        onOpen={() => undefined}
      />,
      testClients({}),
    );
    expect(screen.getByText(/Butun salon: 285\s000/u)).toBeTruthy();
    expect(screen.queryByText('Tez orada joʻnaydi')).toBeNull();
  });
});
