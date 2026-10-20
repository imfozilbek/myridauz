import { register } from './seed';
import { FRESH, NEW, RIDER, seatsOfTomorrow, WAITER } from './walk-cast';
import { walkEach } from './walk-report';

// The walk of the screens (G90) of a passenger before the ride: new, without trips, with a seat,
// with a seat that waits for the driver. Findings: screenshots/stand/walk/<name>.md.
walkEach(
  [
    ['passenger-new', 'passenger', NEW],
    ['passenger-fresh', 'passenger', FRESH],
    ['passenger-seat', 'passenger', RIDER],
    ['passenger-waiting', 'passenger', WAITER],
  ],
  async () => {
    await register('passenger', FRESH, 'female');
    await seatsOfTomorrow();
  },
);
