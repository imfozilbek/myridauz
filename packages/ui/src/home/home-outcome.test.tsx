import { BOOKING_LINK } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { tap } from '../market/market-test-kit';
import { linkOf, PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const HOUR = 60 * 60 * 1000;
const refused = {
  ...booking,
  status: 'declined' as const,
  trip: { ...booking.trip, departAt: Date.now() + 5 * HOUR },
};

// A seat that ended without a trip stays on the main screen until its day (G75, docs/158 А): the
// plate of how it ended, a tap opens the booking with «Oʻxshash safarlar».
describe('how a seat ended, on the main screen', () => {
  it('shows the refused seat on its plate and opens it', async () => {
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [refused] });
    expect(await screen.findByText('Haydovchi joy bera olmadi.')).toBeTruthy();
    expect(document.querySelector('.outcome-plate-off')).toBeTruthy();
    await tap('Haydovchi joy bera olmadi.');
    expect(screen.getByText(linkOf({ name: BOOKING_LINK, id: refused.id }))).toBeTruthy();
  });

  it('forgets it once the trip left', async () => {
    const gone = { ...refused, trip: { ...refused.trip, departAt: Date.now() - HOUR } };
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [gone] });
    await screen.findByText('Soʻrov qoldirish');
    expect(screen.queryByText('Haydovchi joy bera olmadi.')).toBeNull();
  });
});
