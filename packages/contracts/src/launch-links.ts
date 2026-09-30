// A bot button opens the Mini App right on its booking, offer or trip (docs/65 B5): the name of the
// parameter and the form of the id are the same for the bots and the apps.
export const BOOKING_LINK = 'booking';
export const OFFER_LINK = 'offer';
export const MY_TRIP_LINK = 'mytrip';
export const LINK_ID = /^[0-9a-f-]{36}$/u;
export type AppLink = { readonly name: string; readonly id: string };
