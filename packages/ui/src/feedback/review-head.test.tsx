import type { ReviewTarget } from '@platform/contracts';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { renderMarket, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ReviewHead } from './review-head';

afterEach(cleanup);

const withPhotos = (driver: boolean, passenger: boolean) => ({
  ...booking,
  trip: { ...trip, driver: { ...trip.driver, hasAvatar: driver } },
  passenger: { ...booking.passenger, hasAvatar: passenger },
});
const target = (rateeRole: ReviewTarget['rateeRole'], rateeName: string): ReviewTarget => ({
  rateeId: '7',
  rateeName,
  rateeRole,
  mine: null,
});
const letter = () => document.querySelector('.person-badge')?.textContent ?? null;

// The face is the one of the person rated (G78): a driver rating a passenger by a bot link saw the
// photo flag of himself.
describe('the face over the stars', () => {
  it('a driver rates a passenger without a photo: her letter, though the driver has a photo', () => {
    renderMarket(
      <ReviewHead target={target('passenger', 'Dilnoza')} booking={withPhotos(true, false)} />,
      testClients({}),
    );
    expect(letter()).toBe('D');
  });

  it('a passenger rates a driver without a photo: his letter, though the passenger has a photo', () => {
    renderMarket(
      <ReviewHead target={target('driver', 'Jasur')} booking={withPhotos(false, true)} />,
      testClients({}),
    );
    expect(letter()).toBe('J');
  });
});
