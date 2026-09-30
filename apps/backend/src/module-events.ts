import { NO_RATING } from '@platform/contracts';
import {
  cancelAllOf,
  passengerRideCount,
  pickupMessageSent,
  filedRideOfBooking,
  rideOfBooking,
  ridesOfTrips,
} from './modules/bookings';
import { hiddenByComplaints, wireComplaints } from './modules/complaints';
import { channels } from './modules/channels';
import { approvedCar } from './modules/drivers';
import { tellFavoriteFans, wireFavorites } from './modules/favorites';
import { handleAfterSent } from './modules/notifications';
import { handleRequestPublished, requestViewOf } from './modules/ride-requests';
import { wireRealPrices } from './modules/pricing';
import { requestPublished, tripPublished } from './modules/route-subscriptions';
import { ratingsOfPeople, wireRatings } from './modules/ratings';
import { tellTripFamily } from './modules/shares';
import {
  driverTripIds,
  handleTripChange,
  tripForFamily,
  tripsEnded,
  realPricesSince,
  tripViewsOf,
  upcomingTripsOf,
  wireTripStanding,
} from './modules/trips';
import { peopleOf } from './modules/users';
import { refundNoShow } from './modules/wallet';
import type { Bindings } from './env';

// What one module does after another: set here, the one place that knows every module, so the
// modules do not depend on each other in circles.
const tripOf = async (env: Bindings, id: string) => (await tripViewsOf(env, [id]))[0];
const tripChannels = channels(tripOf);

// A published trip goes to the channels and to subscribed passengers; a changed one edits its
// channel posts (docs/15, docs/24); a cancelled one is told to the driver's family (G18).
handleTripChange(async (env, tripId, event) => {
  if (event === 'updated') {
    await tripChannels.changed(env, tripId);
    if ((await tripOf(env, tripId))?.status === 'cancelled') await tellTripFamily(env, tripId, tripForFamily);
    return;
  }
  await tripChannels.posted(env, tripId);
  const trip = await tripOf(env, tripId);
  if (!trip) return;
  await tripPublished(env, trip);
  await tellFavoriteFans(env, trip);
});

// The admin price table shows the median of real prices (G18, docs/09).
wireRealPrices(realPricesSince);

// "Sevimli haydovchilar" (G18): an approved driver as passengers see one, and the driver's trips.
wireFavorites({
  driver: async (env, id) => {
    const [person, car, ratings] = await Promise.all([
      peopleOf(env).find(id),
      approvedCar(env, id),
      ratingsOfPeople(env, [id]),
    ]);
    if (!person || !car) return undefined;
    const { firstName, avatarKey } = person;
    const rating = ratings.get(id) ?? NO_RATING;
    return {
      id,
      firstName,
      hasAvatar: avatarKey !== null,
      car: { make: car.make, model: car.model, color: car.color },
      rating,
    };
  },
  upcoming: upcomingTripsOf,
});

// The Cron job: channel posts of trips that left say so (docs/15).
export const closeDepartedPosts = (env: Bindings) => tripChannels.departed(env);

// A published request reaches subscribed drivers (docs/24).
handleRequestPublished(async (env, requestId) => {
  const request = await requestViewOf(env, requestId);
  if (request) await requestPublished(env, request);
});

// Once Telegram gave a message its id: the passenger answers the confirmation with the pickup
// point (docs/14); a channel post is remembered to be edited later (docs/15).
handleAfterSent((env, after, messageId) =>
  after.type === 'pickup'
    ? pickupMessageSent(env, after.bookingId, messageId)
    : tripChannels.remember(env, after, messageId),
);

// The ratings ask about rides of ended trips and show first names only (docs/24).
wireRatings({
  ended: async (env, from, to) => ridesOfTrips(env, await tripsEnded(env, from, to)),
  ride: rideOfBooking,
  names: async (env, ids) => {
    const people = peopleOf(env);
    const found = await Promise.all(
      ids.map(async (id) => [id, (await people.find(id))?.firstName ?? ''] as const),
    );
    return new Map(found);
  },
});

// Trips show the driver's rating; complaints hide a person from the search (docs/17, docs/24).
wireTripStanding((env) => ({
  ratings: (ids) => ratingsOfPeople(env, ids),
  hidden: (ids) => hiddenByComplaints(env, ids),
}));

// Complaints are about rides; a block cancels live trips and bookings; a no-show may give the
// commission back (docs/17, docs/35).
wireComplaints({
  ride: rideOfBooking,
  filedRide: filedRideOfBooking,
  trips: async (env, userId, side) =>
    side === 'driver' ? (await driverTripIds(env, userId)).length : passengerRideCount(env, userId),
  cancelAll: cancelAllOf,
  refund: refundNoShow,
});
