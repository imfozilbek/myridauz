import { z } from 'zod';
import { DRIVER_TRIPS_PATH, type Trip } from './trips';

// A driver changes a published trip (G39, docs/104): the time only later, at most the brand's minutes
// (+1 hour) from the first time, the same day; the price only lower, not below the bound. A booking
// keeps its price.
// «Tez orada joʻnaydi»: trips leaving within this time are on top of the search (docs/104, 10).
export const SOON_MS = 60 * 60 * 1000;

// The marks of a trip in the search, with an icon and words on its card (docs/104, 10).
export type TripMark = 'soon' | 'cheaper';
export const tripMarks = (trip: Pick<Trip, 'departAt' | 'price' | 'firstPrice'>, now: number) => [
  ...(trip.departAt - now <= SOON_MS ? (['soon'] as const) : []),
  ...(trip.price < trip.firstPrice ? (['cheaper'] as const) : []),
];

export const tripTimePath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/time`;
export const tripPricePath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/price`;

export const tripTimeSchema = z.object({ departAt: z.number().int() });
export type TripTime = z.infer<typeof tripTimeSchema>;
export const tripPriceSchema = z.object({ price: z.number().int().min(1) });
export type TripPrice = z.infer<typeof tripPriceSchema>;
