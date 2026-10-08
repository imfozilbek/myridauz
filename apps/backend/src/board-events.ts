import { boardTripOf } from './modules/bookings';
import { wireRequestBoard } from './modules/ride-requests';
import { requestRoutesOf } from './modules/route-subscriptions';
import { driverDirections } from './modules/trips';

// The board of requests of a driver (G64, docs/118 path 7): the driver's directions from the trips and
// the subscriptions, the nearest trip with its passengers from the bookings. Set here, like
// module-events.ts, so the modules do not depend on each other in circles.
wireRequestBoard({
  directions: async (env, driverId) => [
    ...(await driverDirections(env, driverId)),
    ...(await requestRoutesOf(env, driverId)),
  ],
  trip: boardTripOf,
});
