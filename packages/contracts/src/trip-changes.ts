import { z } from 'zod';
import { DRIVER_TRIPS_PATH } from './trips';

// A driver changes a published trip (G39, docs/104): the time only later, at most +1 hour from the
// first time, the same day; the price only lower, not below the bound. A booking keeps its price.
export const MAX_TRIP_SHIFT_MS = 60 * 60 * 1000;
// «Tez orada joʻnaydi»: trips leaving within this time are on top of the search (docs/104, 10).
export const SOON_MS = 60 * 60 * 1000;

export const tripTimePath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/time`;
export const tripPricePath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/price`;

export const tripTimeSchema = z.object({ departAt: z.number().int() });
export type TripTime = z.infer<typeof tripTimeSchema>;
export const tripPriceSchema = z.object({ price: z.number().int().min(1) });
export type TripPrice = z.infer<typeof tripPriceSchema>;
