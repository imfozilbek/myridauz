// A bot button opens the Mini App right on its booking, offer or trip (docs/65 B5): the name of the
// parameter and the form of the id are the same for the bots and the apps.
export const BOOKING_LINK = 'booking';
export const OFFER_LINK = 'offer';
export const MY_TRIP_LINK = 'mytrip';
export const LINK_ID = /^[0-9a-f-]{36}$/u;
export type AppLink = { readonly name: string; readonly id: string };

// A new request on a route a driver follows opens the requests of its route and day (docs/83 N08):
// ?requests=<from>_<to>_<date>.
export const REQUESTS_LINK = 'requests';
export const REQUESTS_LINK_VALUE = /^(\d{2,10})_(\d{2,10})_(\d{4}-\d{2}-\d{2})$/u;
export const requestsLinkValue = (from: string, to: string, date: string) => `${from}_${to}_${date}`;
