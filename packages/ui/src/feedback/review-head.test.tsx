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
// The icon of the face without a photo: a passenger or a driver (owner decision 12.10.2026).
const icon = () => document.querySelector('.person-badge svg')?.getAttribute('class') ?? null;

// The face is the one of the person rated (G78): a driver rating a passenger by a bot link saw the
// photo flag of himself.
describe('the face over the stars', () => {
  it('a driver rates a passenger without a photo: her icon, though the driver has a photo', () => {
    renderMarket(
      <ReviewHead target={target('passenger', 'Dilnoza')} booking={withPhotos(true, false)} />,
      testClients({}),
    );
    expect(icon()).toContain('lucide-user-round');
  });

  it('a passenger rates a driver without a photo: his icon, though the passenger has a photo', () => {
    renderMarket(
      <ReviewHead target={target('driver', 'Jasur')} booking={withPhotos(false, true)} />,
      testClients({}),
    );
    expect(icon()).toContain('lucide-car-front');
  });
});
