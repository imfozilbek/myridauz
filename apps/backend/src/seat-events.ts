import { heldSeatOf } from './modules/bookings';
import { wireHeldSeats } from './modules/ride-requests';

// One at a time (owner decision 12.10.2026, docs/172): a passenger with a seat leaves no request. The
// bookings know the seats; set here, like module-events.ts, so the modules do not depend in circles.
wireHeldSeats(heldSeatOf);
