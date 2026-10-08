import { MINUTE_MS, type Booking } from '@platform/contracts';
import { confirmed } from '../bookings/booking-test-kit';

// Test helper for the meeting of the driver (G63): Madina from her door, Akmal from the pitak.
export const madina: Booking = {
  ...confirmed,
  id: 'm1',
  passenger: { ...confirmed.passenger, firstName: 'Madina' },
  pickup: {
    point: { lat: 41.2856, lng: 69.2045 },
    name: { step: 'landmark', name: 'Grand' },
    area: { step: 'mahalla', name: 'Qatortol' },
  },
};
export const akmal: Booking = {
  ...confirmed,
  id: 'a1',
  seats: 1,
  commission: 9500,
  mode: 'pitak',
  passenger: { ...confirmed.passenger, id: '0000000000000000000000000000000a', firstName: 'Akmal' },
  pitak: confirmed.trip.pitak,
  pickup: null,
};
// Ten minutes before the departure: the meeting is open (docs/126).
export const MEETING_NOW = confirmed.trip.departAt - 10 * MINUTE_MS;
