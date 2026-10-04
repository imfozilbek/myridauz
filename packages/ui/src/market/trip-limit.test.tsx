import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, trip } from './market-test-kit';
import { NewTripFlow } from './new-trip-flow';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const open = (trips: readonly (typeof trip)[]) =>
  renderMarket(
    <NewTripFlow onBack={() => undefined} />,
    testClients({ market: { myTrips: async () => [...trips] } }),
  );

// The driver hears of the limit of 3 trips before filling a new one, not at its end (G52, docs/112).
describe('the limit of active trips', () => {
  it('stops a new trip at once when 3 trips are active', async () => {
    open([trip, { ...trip, id: 't2', status: 'full' }, { ...trip, id: 't3' }]);
    expect(
      await screen.findByText('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.'),
    ).toBeTruthy();
  });

  it('opens the route when a cancelled or a past trip does not count', async () => {
    open([trip, { ...trip, id: 't2', status: 'cancelled' }, { ...trip, id: 't3', status: 'completed' }]);
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
    expect(screen.queryByText('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.')).toBeNull();
  });
});
