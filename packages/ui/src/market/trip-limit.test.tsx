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

// One live trip of a driver (owner decision 12.10.2026, docs/172), heard before filling a new one,
// not at its end (G52, docs/112).
describe('one live trip of a driver', () => {
  it('stops a new trip at once while one trip is live, «Mening safarlarim» opens it', async () => {
    open([trip, { ...trip, id: 't2', status: 'cancelled' }]);
    // Mockup g75/1 A, phone 3 (G75): the number, what to do, one button.
    expect(await screen.findByText('Faol safarlar 1 ta')).toBeTruthy();
    expect(
      screen.getByText('Yangi safar eʼlon qilish uchun bittasini bekor qiling yoki yakunlang.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Mening safarlarim'));
    expect(await screen.findByText('Faol (1)')).toBeTruthy();
  });

  it('opens the route when a cancelled, a past or an arrived trip does not count', async () => {
    open([
      { ...trip, status: 'cancelled' },
      { ...trip, id: 't2', status: 'completed' },
      { ...trip, id: 't3', arrivedAt: trip.departAt },
    ]);
    expect(await screen.findByText('Qayerdan yoʻlga chiqasiz?')).toBeTruthy();
    expect(screen.queryByText(/Faol safarlar/u)).toBeNull();
  });
});
