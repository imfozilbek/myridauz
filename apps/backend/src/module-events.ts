import { pickupMessageSent, rideOfBooking, ridesOfTrips } from './modules/bookings';
import { channels } from './modules/channels';
import { handleAfterSent } from './modules/notifications';
import { handleRequestPublished, requestViewOf } from './modules/ride-requests';
import { requestPublished, tripPublished } from './modules/route-subscriptions';
import { ratingsOfPeople, wireRatings } from './modules/ratings';
import { handleTripChange, tripsEnded, tripViewsOf, wireTripStanding } from './modules/trips';
import { peopleOf } from './modules/users';
import type { Bindings } from './env';

// What one module does after another: set here, the one place that knows every module, so the
// modules do not depend on each other in circles.
const tripOf = async (env: Bindings, id: string) => (await tripViewsOf(env, [id]))[0];
const tripChannels = channels(tripOf);

// A published trip goes to the channels and to subscribed passengers; a changed one edits its
// channel posts (docs/15, docs/24).
handleTripChange(async (env, tripId, event) => {
  if (event === 'updated') return tripChannels.changed(env, tripId);
  await tripChannels.posted(env, tripId);
  const trip = await tripOf(env, tripId);
  if (trip) await tripPublished(env, trip);
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
  hidden: async () => new Set(),
}));
