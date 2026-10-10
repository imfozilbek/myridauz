import { expireBookingsOfTrip, tellBookedOfRetime, tellDriver, tellTripPassengers } from './modules/bookings';
import { channelBoards, channels } from './modules/channels';
import { tellFavoriteFans } from './modules/favorites';
import { handleAfterSent } from './modules/notifications';
import { tripCheaper, tripPublished } from './modules/route-subscriptions';
import { tellTripFamily, tellTripFamilyRetimed } from './modules/shares';
import { handleTripChange, tripForFamily, tripsOfDate, tripViewsOf } from './modules/trips';
import type { Bindings } from './env';

// What follows a change of a trip in the other modules (module-events.ts sets the rest).
const tripOf = async (env: Bindings, id: string) => (await tripViewsOf(env, [id]))[0];
const tripChannels = channels(tripOf);
const boards = channelBoards(tripOf, tripsOfDate);

// The trip card of the driver bot and the boards of the day follow every change (G68). A published
// trip goes to the channels and to subscribed passengers; a changed one edits its posts (docs/15,
// docs/24); a cancelled one is told to the driver's family (G18). A new time or a lower price reaches
// the booked passengers, a lower price the subscribed ones too (G39, docs/104). «Yoʻlga chiqdim»
// closes the posts and the unanswered requests (G63); passengers hear it (G68); the arrival edits
// the posts once more.
handleTripChange(async (env, tripId, event) => {
  await tellDriver(env, tripId);
  await boards.ofTrip(env, tripId);
  // «Yetib bordi» in the channel posts: how many people went in one car (G68, docs/122).
  if (event === 'arrived' || event === 'completed') {
    await tellTripPassengers(env, tripId);
    return tripChannels.changed(env, tripId);
  }
  if (event === 'departed') {
    await expireBookingsOfTrip(env, tripId);
    await tellTripPassengers(env, tripId, 'departed');
    return tripChannels.left(env, tripId);
  }
  if (event === 'published') {
    await tripChannels.posted(env, tripId);
    const trip = await tripOf(env, tripId);
    if (trip) await tripPublished(env, trip).then(() => tellFavoriteFans(env, trip));
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
  if (event === 'retimed') {
    await tellBookedOfRetime(env, tripId);
    await tellTripFamilyRetimed(env, tripId, tripForFamily);
  }
  if (event === 'cheaper' && trip) await tripCheaper(env, trip);
});

// The Cron job: channel posts of trips that left say so (docs/15); the boards of the day follow the
// clock too (G68, docs/122).
export const closeDepartedPosts = (env: Bindings) => tripChannels.departed(env);
export const showChannelBoards = (env: Bindings) => boards.all(env);
export const sendChannelSummaries = (env: Bindings) => boards.summaries(env);

// Once Telegram gave a message its id: a channel post is remembered to be edited later (docs/15).
handleAfterSent((env, after, messageId) => tripChannels.remember(env, after, messageId));
