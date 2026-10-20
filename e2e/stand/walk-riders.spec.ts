import { ASKER, DONE, PAST_DRIVER, requestWithOffer, rideOfToday } from './walk-cast';
import { walkEach } from './walk-report';

// The walk of the screens (G90): a passenger with a request and an offer on it, and the two sides of
// a ride that ended an hour ago. Findings: screenshots/stand/walk/<name>.md.
walkEach(
  [
    ['passenger-request', 'passenger', ASKER],
    ['passenger-after-ride', 'passenger', DONE],
    ['driver-after-ride', 'driver', PAST_DRIVER],
  ],
  async () => {
    await requestWithOffer();
    await rideOfToday();
  },
);
