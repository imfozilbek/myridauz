import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, trip } from './market-test-kit';
import { PlacesGate } from './places-gate';
import { TripCard } from './trip-card';

afterEach(cleanup);

const card = (requests = 0) =>
  renderMarket(
    <PlacesGate>
      <TripCard trip={trip} own requests={requests} onOpen={() => undefined} />
    </PlacesGate>,
    testClients({}),
  );

describe('the card of an own trip (G41, docs/90 F-D4)', () => {
  it('says how many new requests wait, so the driver sees it in the list', async () => {
    card(2);
    expect(await screen.findByText('2 ta yangi soʻrov')).toBeTruthy();
  });

  it('says nothing when no request waits', async () => {
    card();
    expect(await screen.findByText('Faol')).toBeTruthy();
    expect(screen.queryByText(/yangi soʻrov/u)).toBeNull();
  });
});
