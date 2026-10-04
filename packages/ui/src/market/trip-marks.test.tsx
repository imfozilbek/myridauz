import type { Trip } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, trip } from './market-test-kit';
import { PlacesGate } from './places-gate';
import { TripCard } from './trip-card';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const card = (shown: Trip, own = false) =>
  renderMarket(
    <PlacesGate>
      <TripCard trip={shown} own={own} onOpen={() => undefined} />
    </PlacesGate>,
    testClients({}),
  );

describe('the marks of a trip in the search (G39, docs/104, 10)', () => {
  it('shows «Tez orada joʻnaydi» within an hour and «Narxi tushdi» after a lower price', async () => {
    const soon = { ...trip, departAt: Date.now() + HOUR / 2, price: 90000 };
    card(soon);
    expect(await screen.findByText('Tez orada joʻnaydi')).toBeTruthy();
    expect(screen.getByText('Narxi tushdi')).toBeTruthy();
  });

  it('shows no marks on a usual trip and on the own trips of a driver', async () => {
    const later = { ...trip, departAt: Date.now() + 3 * HOUR };
    card(later);
    await screen.findByText('Jasur');
    expect(screen.queryByText('Tez orada joʻnaydi')).toBeNull();
    cleanup();
    const cheaper = { ...later, price: 90000 };
    card(cheaper, true);
    await screen.findByText('Faol');
    expect(screen.queryByText('Narxi tushdi')).toBeNull();
  });
});
