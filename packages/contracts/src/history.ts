import { z } from 'zod';
import { locationIdSchema } from './locations';
import { ratingSchema } from './ratings';

// "Safarlar tarixi" in the profile (docs/18): past trips and their stars. G18.
export const PASSENGER_HISTORY_PATH = '/passenger/history';
export const DRIVER_HISTORY_PATH = '/driver/history';
export const HISTORY_LIMIT = 50;

// One past trip: with whom, and the stars both ways. "given" is what this person gave;
// "received" only once the review is published (the blind rule of docs/24).
export const historyItemSchema = z.object({
  id: z.string(),
  from: locationIdSchema,
  to: locationIdSchema,
  departAt: z.number().int(),
  km: z.number().int(),
  price: z.number().int(),
  seats: z.number().int(),
  // The driver for a passenger; the passengers for a driver. First names only (docs/07).
  people: z.array(z.string()),
  given: z.number().int().nullable(),
  received: z.number().nullable(),
});
export type HistoryItem = z.infer<typeof historyItemSchema>;
export const historySchema = z.object({ trips: z.array(historyItemSchema) });
export type History = z.infer<typeof historySchema>;

// The three numbers on top of «Profil» (G65, mockup g65/3): the rating, the trips that are over and
// how often others marked the person «Vaqtida».
export const PASSENGER_STANDING_PATH = '/passenger/standing';
export const DRIVER_STANDING_PATH = '/driver/standing';
export const standingSchema = z.object({
  rating: ratingSchema,
  // The share of published reviews marked «Vaqtida», 0 … 100; null while the rating is still new.
  onTime: z.number().int().nullable(),
  // A passenger: the rides that are over; a driver: the trips that are over with a ride in them.
  trips: z.number().int(),
});
export type Standing = z.infer<typeof standingSchema>;
