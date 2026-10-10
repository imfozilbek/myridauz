import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const HOUR = 60 * 60 * 1000;
const departAt = Date.now() + 5 * HOUR;
const refused = {
  ...booking,
  status: 'declined' as const,
  trip: { ...booking.trip, departAt, firstDepartAt: departAt },
};

// A seat that ended without a trip stays in the block until its day (G76, mockup g76/2 state 14):
// why, then other trips of the same way or a request.
describe('how a seat ended, in the block at the bottom', () => {
  it('shows the refused seat and finds other trips of its way', async () => {
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [refused] });
    expect(await screen.findByText('Haydovchi joy bera olmadi')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Soʻrov qoldirish' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Oʻxshash safarlar' }));
    expect(await screen.findByText(/Toshkent/u)).toBeTruthy();
  });

  it('forgets it once the trip left', async () => {
    const gone = { ...refused, trip: { ...refused.trip, departAt: Date.now() - HOUR } };
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [gone] });
    await screen.findByText('Soʻrov qoldirish');
    expect(screen.queryByText('Haydovchi joy bera olmadi')).toBeNull();
  });
});
