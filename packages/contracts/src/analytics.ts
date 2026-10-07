import { z } from 'zod';
import { CLIENT_PATTERN, VIA_PATTERN } from './arrival';
import { NAVIGATORS } from './navigator';

// Product analytics events (docs/29). One place for all Mini Apps; add an event when a goal needs it.
export const ANALYTICS_PATH = '/analytics';
export const MAX_ANALYTICS_BATCH = 50;
export const MINI_APPS = ['passenger', 'driver', 'admin'] as const;
export type MiniApp = (typeof MINI_APPS)[number];
// G34: two screens. «consent» on the welcome, «about» when the answers are sent, then the phone.
export const REGISTRATION_STEPS = ['consent', 'about', 'phone', 'done'] as const;
export type RegistrationStep = (typeof REGISTRATION_STEPS)[number];
export const DRIVER_STEPS = ['car', 'color', 'plate', 'seats', 'photos', 'submitted'] as const;
export type DriverStep = (typeof DRIVER_STEPS)[number];
// The main screen (G25): a trip of the block, the question card, the last route, the main button.
// The tiles of «Hamyon» and «Yordam» (G53).
const HOME_TARGETS = ['item', 'card', 'last_route', 'main_button', 'retry', 'wallet', 'support'] as const;
export const TRIP_STEPS = [
  'route',
  'mode',
  // The day and the time on one screen (G38, docs/103).
  'when',
  // The seats and «ayol bor» on one screen (G38, docs/103 point 8).
  'seats',
  'price',
  'comment',
  'published',
] as const;
export type TripStep = (typeof TRIP_STEPS)[number];
// The booking funnel (G08): both ways, from the first tap to the confirmation.
const BOOKING_STEPS = [
  'seats',
  // G26: the way and the points of the passenger come at the booking (docs/74).
  'mode',
  'pickup',
  'dropoff',
  'requested',
  'confirmed',
  'declined',
  'cancelled',
  'offer_sent',
  'offer_accepted',
  'offer_declined',
  // «Men keldim» at the meeting point (docs/126).
  'came',
] as const;

// The screen of the start and the end (G24, docs/29): how a point was chosen, and the funnel.
const POINT_METHODS = ['map', 'search', 'location', 'recent', 'saved'] as const;
const WAY_STEPS = ['opened', 'from', 'to', 'done'] as const;

// Answers that are a normal state, not an error: they are not sent as api_error (G12).
export const QUIET_API_ERRORS: readonly string[] = ['users.not_registered', 'drivers.not_found'];

// Screens and codes are ids, never free text: no personal data can get in (docs/29).
const id = z.string().regex(/^[a-z][a-z0-9_.]{0,47}$/);
const context = {
  app: z.enum(MINI_APPS),
  screen: id,
  at: z.number().int().positive(),
  sessionId: z.uuid(),
  version: z.string().max(32),
};

// G52: what broke a screen, to find it (docs/112). The class of the error and its words without
// numbers or signs, never free text of a person; client: the Telegram platform, its version
// and the engine with its major version («android 9.6 chrome 83»).
const crash = {
  error: z
    .string()
    .regex(/^[A-Za-z]{1,40}$/)
    .optional(),
  detail: z
    .string()
    .regex(/^[A-Za-z .,'()_:#-]{0,120}$/)
    .optional(),
  client: z.string().regex(CLIENT_PATTERN).optional(),
  // The place in the build: «index-abc.js:95:12345», no words of a person (docs/112).
  where: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,80}\.js:\d{1,7}:\d{1,7}$/)
    .optional(),
};

export const analyticsEventSchema = z.discriminatedUnion('name', [
  // The first screen of a launch says where the person came from: the kind of the startapp link,
  // «direct» without one (docs/89 S3). Only the kind, never the ids of the link. G55: also the mark
  // of the source (a channel, an ad) and the platform (docs/116).
  z.object({
    name: z.literal('screen_open'),
    source: id.optional(),
    via: z.string().regex(VIA_PATTERN).optional(),
    client: z.string().regex(CLIENT_PATTERN).optional(),
    ...context,
  }),
  z.object({ name: z.literal('client_error'), code: id, ...crash, ...context }),
  // An answer of the API with an error (G12): its code and the last opened screen.
  z.object({ name: z.literal('api_error'), code: id, ...context }),
  // Registration funnel (G04): one event per finished step, to see where people stop.
  z.object({ name: z.literal('registration_step'), step: z.enum(REGISTRATION_STEPS), ...context }),
  // Driver funnel (G06): one event per finished step of the application, up to "submitted".
  z.object({ name: z.literal('driver_application_step'), step: z.enum(DRIVER_STEPS), ...context }),
  // Trips (G07): the steps of a new trip, a search and whether it found something, an opened trip.
  z.object({ name: z.literal('trip_step'), step: z.enum(TRIP_STEPS), ...context }),
  z.object({ name: z.literal('trip_search'), result: z.enum(['found', 'empty']), ...context }),
  z.object({ name: z.literal('trip_open'), ...context }),
  // Bookings (G08): one event per step of the funnel; a refused confirmation carries the reason.
  z.object({ name: z.literal('booking_step'), step: z.enum(BOOKING_STEPS), ...context }),
  z.object({ name: z.literal('wallet_open'), ...context }),
  // Chat (G09): an opened chat and the first message a person sends in it.
  z.object({ name: z.literal('chat_open'), ...context }),
  z.object({ name: z.literal('chat_first_message'), ...context }),
  // "Yaqinlarimga yuborish" (G09, docs/43): shared, opened and followed by close people, the trip steps;
  // share_join: a close person goes on to the registration (docs/18).
  z.object({ name: z.literal('trip_shared'), ...context }),
  z.object({ name: z.literal('share_opened'), ...context }),
  z.object({ name: z.literal('share_follow'), ...context }),
  z.object({ name: z.literal('share_join'), ...context }),
  z.object({ name: z.literal('boarded'), ...context }),
  z.object({ name: z.literal('arrived'), ...context }),
  // Route subscriptions (G10, docs/24): "Xabar bering" and the list "Obunalar".
  z.object({ name: z.literal('route_subscribed'), ...context }),
  z.object({ name: z.literal('subscriptions_open'), ...context }),
  // Ratings and complaints (G11, docs/17, docs/24): a review sent, a complaint sent, a decision made.
  z.object({ name: z.literal('review_sent'), ...context }),
  z.object({ name: z.literal('complaint_sent'), ...context }),
  z.object({ name: z.literal('complaint_decided'), ...context }),
  // Comfort and retention (G18, docs/18): a saved driver, a return trip, a driver's shared trip.
  z.object({ name: z.literal('favorite_driver'), ...context }),
  z.object({ name: z.literal('return_trip_created'), ...context }),
  z.object({ name: z.literal('driver_trip_shared'), ...context }),
  // G28: a driver put an open trip into a Telegram story (docs/88 L19).
  z.object({ name: z.literal('driver_trip_story'), ...context }),
  // G24: the way of choosing a point; an empty search keeps only the length, never the text: it
  // may be an address (docs/69).
  z.object({ name: z.literal('place_point_saved'), method: z.enum(POINT_METHODS), ...context }),
  z.object({ name: z.literal('place_search_empty'), length: z.number().int().min(0).max(100), ...context }),
  z.object({ name: z.literal('way_step'), step: z.enum(WAY_STEPS), ...context }),
  // «Yoʻl koʻrsatish» of the driver: which navigator opened the stops (docs/70).
  z.object({ name: z.literal('route_opened'), navigator: z.enum(NAVIGATORS), ...context }),
  // G25: what the person tapped on the main screen.
  z.object({ name: z.literal('home_tap'), target: z.enum(HOME_TARGETS), ...context }),
]);
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
