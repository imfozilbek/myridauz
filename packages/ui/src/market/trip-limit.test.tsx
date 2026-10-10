import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, trip } from './market-test-kit';
import { NewTripFlow } from './new-trip-flow';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const open = (trips: readonly (typeof trip)[]) =>
  renderMarket(
    <NewTripFlow onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [...trips] },
      bookings: { driverBookings: async () => [], driverOffers: async () => [] },
    }),
  );

// The driver hears of the limit of 3 trips before filling a new one, not at its end (G52, docs/112).
describe('the limit of active trips', () => {
  it('stops a new trip at once when 3 trips are active, «Mening safarlarim» opens them', async () => {
    open([trip, { ...trip, id: 't2', status: 'full' }, { ...trip, id: 't3' }]);
    // Mockup g75/1 A, phone 3 (G75): the number, what to do, one button.
    expect(await screen.findByText('Faol safarlar 3 ta')).toBeTruthy();
    expect(
      screen.getByText('Yangi safar eʼlon qilish uchun bittasini bekor qiling yoki yakunlang.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Mening safarlarim'));
    expect(await screen.findByText('Faol (3)')).toBeTruthy();
  });

  it('opens the route when a cancelled or a past trip does not count', async () => {
    open([trip, { ...trip, id: 't2', status: 'cancelled' }, { ...trip, id: 't3', status: 'completed' }]);
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
    expect(screen.queryByText('Faol safarlar 3 ta')).toBeNull();
  });
});
