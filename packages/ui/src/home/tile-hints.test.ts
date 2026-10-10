import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { booking, offer, request } from '../bookings/booking-test-kit';
import { trip } from '../market/market-test-kit';
import { driverTripsHint, passengerTripsHint } from './tile-hints';

const seat = { ...booking, status: 'confirmed' as const };
const done = { ...booking, status: 'completed' as const };

describe('the words under «Mening safarlarim» of a passenger (G76, mockup g76/2)', () => {
  it('says the time of the only seat, else how many seats', () => {
    expect(passengerTripsHint([seat], [], [])).toEqual({ at: trip.departAt });
    expect(passengerTripsHint([seat, { ...seat, id: 'b2' }], [], [])).toEqual({
      key: 'home.tile.seats',
      count: 2,
    });
  });

  it('says the seats asked, then the offers, then the open requests', () => {
    expect(passengerTripsHint([booking], [request], [offer])).toEqual({ key: 'home.tile.asked', count: 1 });
    expect(passengerTripsHint([], [request], [offer])).toEqual({ key: 'home.tile.offers', count: 1 });
    expect(passengerTripsHint([], [request], [])).toEqual({ key: 'home.tile.requests', count: 1 });
  });

  it('counts the past trips, or says there is none yet', () => {
    expect(passengerTripsHint([done, { ...done, id: 'b2' }], [], [])).toEqual({
      key: 'home.tile.past',
      count: 2,
    });
    expect(passengerTripsHint([], [], [])).toEqual({ key: 'home.tile.none' });
  });
});

describe('the words under «Mening safarlarim» of a driver (G76, mockup g76/3)', () => {
  const before = trip.departAt - DAY_MS;

  it('counts the waiting requests first, then says the nearest trip', () => {
    expect(driverTripsHint([trip], [booking], before)).toEqual({ key: 'home.newRequests', count: 1 });
    expect(driverTripsHint([trip], [seat], before)).toEqual({ at: trip.departAt });
  });

  it('counts the trips of the week when none is ahead, or says there is none yet', () => {
    const made = { ...trip, status: 'completed' as const };
    expect(driverTripsHint([made], [], trip.departAt + DAY_MS)).toEqual({
      key: 'home.driver.week',
      count: 1,
    });
    expect(driverTripsHint([], [], before)).toEqual({ key: 'home.tile.none' });
  });
});
