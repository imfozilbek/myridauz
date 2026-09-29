import { pickupMessageSent } from './modules/bookings';
import { channels } from './modules/channels';
import { handleAfterSent } from './modules/notifications';
import { handleTripChange, tripViewsOf } from './modules/trips';

// What one module does after another: set here, the one place that knows every module, so the
// modules do not depend on each other in circles.
const tripChannels = channels(async (env, id) => (await tripViewsOf(env, [id]))[0]);

// A published trip goes to the channels, a changed one edits its posts (docs/15).
handleTripChange((env, tripId, event) =>
  event === 'published' ? tripChannels.posted(env, tripId) : tripChannels.changed(env, tripId),
);

// Once Telegram gave a message its id: the passenger answers the confirmation with the pickup
// point (docs/14); a channel post is remembered to be edited later (docs/15).
handleAfterSent((env, after, messageId) =>
  after.type === 'pickup'
    ? pickupMessageSent(env, after.bookingId, messageId)
    : tripChannels.remember(env, after, messageId),
);
