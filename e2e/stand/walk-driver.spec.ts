import { DRIVER, NEW_DRIVER, requestWithOffer } from './walk-cast';
import { walkEach } from './walk-report';

// The walk of the screens (G90) of a driver: new, and with a trip of tomorrow that has a confirmed
// seat, a seat to answer and a request with his offer. Findings: screenshots/stand/walk/<name>.md.
walkEach(
  [
    ['driver-new', 'driver', NEW_DRIVER],
    ['driver-trip', 'driver', DRIVER],
  ],
  requestWithOffer,
);
