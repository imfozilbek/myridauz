import { z } from 'zod';
import { locationIdSchema } from './locations';
import { dateSchema } from './tashkent-time';

// How many trips go where (G59, docs/118 path 2): one request, one read of the trips by the index
// trips_from (docs/117).
export const TRIP_DIRECTIONS_PATH = '/trips/directions';
export const TRIP_DAYS_PATH = '/trips/days';
// «Safarlar» counts the trips of a week: today and the 6 days after it.
export const COUNTED_DAYS = 7;

export const directionsQuerySchema = z.object({ from: locationIdSchema });
export const daysQuerySchema = z.object({ from: locationIdSchema, to: locationIdSchema });

// A tile of a direction: the region and its trips today and tomorrow. No price for now (owner,
// 12.11.2026: «Цены пока не нужны»).
export const directionCardSchema = z.object({
  to: locationIdSchema,
  today: z.number().int().nonnegative(),
  tomorrow: z.number().int().nonnegative(),
});
export type DirectionCard = z.infer<typeof directionCardSchema>;
export const directionCardsSchema = z.object({ directions: z.array(directionCardSchema) });

// The days of «Safarlar» with their trips, and the way: «≈ 300 km · ≈ 5 soat».
export const tripDaySchema = z.object({ date: dateSchema, trips: z.number().int().nonnegative() });
export type TripDay = z.infer<typeof tripDaySchema>;
// «Samarqandning qaysi joyi?» (G75, mockup g75/6 A): the trips of the week by the place they go to,
// the busiest first; a place without trips is not listed.
export const placeTripsSchema = z.object({ to: locationIdSchema, trips: z.number().int().positive() });
export type PlaceTrips = z.infer<typeof placeTripsSchema>;
export const tripDaysSchema = z.object({
  km: z.number().int().nonnegative(),
  days: z.array(tripDaySchema),
  places: z.array(placeTripsSchema),
});
export type TripDays = z.infer<typeof tripDaysSchema>;
