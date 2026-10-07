import { NO_RATING } from '@platform/contracts';
import {
  cancelAllOf,
  passengerRideCount,
  filedRideOfBooking,
  rideOfBooking,
  ridesOfTrips,
  tellBookedOfRetime,
} from './modules/bookings';
import { hiddenByComplaints, wireComplaints } from './modules/complaints';
import { assignTo } from './modules/assignments';
import { channels, inviteFromMark } from './modules/channels';
import { approvedCar } from './modules/drivers';
import { tellFavoriteFans, wireFavorites } from './modules/favorites';
import { handleAfterSent } from './modules/notifications';
import { handleRequestPublished, requestViewOf, wireHiddenRequesters } from './modules/ride-requests';
import { wireRealPrices } from './modules/pricing';
import { requestPublished, tripCheaper, tripPublished } from './modules/route-subscriptions';
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
import { peopleOf, wireFaceTeam, wireRegistered } from './modules/users';
import { refundNoShow } from './modules/wallet';
import type { Bindings } from './env';

// What one module does after another: set here, the one place that knows every module, so the
// modules do not depend on each other in circles.
const tripOf = async (env: Bindings, id: string) => (await tripViewsOf(env, [id]))[0];
const tripChannels = channels(tripOf);

// A published trip goes to the channels and to subscribed passengers; a changed one edits its
// channel posts (docs/15, docs/24); a cancelled one is told to the driver's family (G18). A new time
// or a lower price reaches the booked passengers, a lower price the subscribed ones too (G39, docs/104).
handleTripChange(async (env, tripId, event) => {
  if (event === 'published') {
    await tripChannels.posted(env, tripId);
    const trip = await tripOf(env, tripId);
    if (!trip) return;
    await tripPublished(env, trip);
    await tellFavoriteFans(env, trip);
    return;
  }
  await tripChannels.changed(env, tripId);
  const trip = await tripOf(env, tripId);
  if (event === 'updated') {
    if (trip?.status === 'cancelled') await tellTripFamily(env, tripId, tripForFamily);
    return;
  }
  // A lower price reaches the subscribers and the channel, never the booked passengers: their
  // booking keeps its price (owner decision 04.10.2026).
  if (event === 'retimed') await tellBookedOfRetime(env, tripId);
  if (event === 'cheaper' && trip) await tripCheaper(env, trip);
});

// A new face goes to the member who gets the person's application that day (docs/92, G51); a new
// person who came by a channel post hears of the channel of that zone (docs/119).
wireFaceTeam((env, userId) => assignTo(env, 'application', userId));
wireRegistered((env) => (userId, came) => inviteFromMark(env, userId, came?.via));

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
    const { firstName, avatarShown } = person;
    const rating = ratings.get(id) ?? NO_RATING;
    return {
      id: person.publicId,
      firstName,
      hasAvatar: avatarShown,
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

// Once Telegram gave a message its id: a channel post is remembered to be edited later (docs/15).
handleAfterSent((env, after, messageId) => tripChannels.remember(env, after, messageId));

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
wireHiddenRequesters(hiddenByComplaints);

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
