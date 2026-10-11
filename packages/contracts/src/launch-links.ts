// A bot button opens the Mini App right on its booking, offer or trip (docs/65 B5): the name of the
// parameter and the form of the id are the same for the bots and the apps.
export const BOOKING_LINK = 'booking';
export const OFFER_LINK = 'offer';
export const MY_TRIP_LINK = 'mytrip';
// «Soʻrovim» of the main screen opens the open request of the passenger (G66, mockup g66/1).
export const REQUEST_LINK = 'request';
// A trip ready to book: a channel post, a subscription, a new trip of a saved driver (docs/15, G60).
export const TRIP_LINK = 'trip';
export const LINK_ID = /^[0-9a-f-]{36}$/u;
export type AppLink = { readonly name: string; readonly id: string };

// A new request on a route a driver follows opens the requests of its route and day (docs/83 N08):
// ?requests=<from>_<to>_<date>.
export const REQUESTS_LINK = 'requests';
export const REQUESTS_LINK_VALUE = /^(\d{2,10})_(\d{2,10})_(\d{4}-\d{2}-\d{2})$/u;
export const requestsLinkValue = (from: string, to: string, date: string) => `${from}_${to}_${date}`;

// «Boshqa safar topish» under a refused, burned or cancelled booking (docs/89 S10): the search of
// the same route and day, ?find=<from>_<to>_<date>, the same value as the requests link.
export const FIND_LINK = 'find';

// «Rasmni almashtirish» under a face photo the team did not approve: the profile, to put a new one
// (docs/118).
export const PROFILE_PHOTO_LINK: AppLink = { name: 'profile', id: 'photo' };

// «Hisobni toʻldirish» before the payments (G75, docs/124 Г): the support bot opens with
// start=topup and sends the team the ready question.
export const TOP_UP_START = 'topup';

// A bot button opens a section of the main screen at once: ?open=<section> (G62, docs/119).
export const OPEN_LINK = 'open';
export const OPEN_LINK_VALUE = /^[a-z_]{1,32}$/u;
// «Safar eʼlon qilish»: the section of a new trip in the driver app.
export const NEW_TRIP_SECTION = 'new_trip';
// «Hamyon» of the driver: its tiles and the wallet messages of the driver bot open it (G65, G68).
export const WALLET_SECTION = 'wallet';
// The trips of the team in the admin app: «Bronni ochish» under a support question opens one of
// them, ?open=trips&trip=<id> (G68, mockup g68/4).
export const TEAM_TRIPS_SECTION = 'trips';

// «💬 Chat» and «📞 Qoʻngʻiroq» under a trip card (G77): the chat of the seat, or the call of it at once.
export const CHAT_LINK = 'chat';
export const CALL_LINK = 'call';

// A ring of a bot that asks for an answer opens the main screen with its sheet first (docs/122,
// G68): ?sheet=<id>, the id of the booking or the offer, or the chat key.
export const SHEET_LINK = 'sheet';
export const SHEET_LINK_VALUE = /^[bot]?[0-9a-f-]{36}$/u;
