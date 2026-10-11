import { tashkentDate, type Trip } from '@platform/contracts';

// «Oʻxshash safarlar» of a seat that ended badly (G77, docs/168 B): the same route on the day of its
// trip, from the block of the main screen and from the page of the seat alike.
export const similarDay = (trip: Trip): string => tashkentDate(trip.departAt);
