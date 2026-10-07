import { z } from 'zod';
import { locationIdSchema } from './locations';
import { dateSchema } from './tashkent-time';

// How many trips go where (G59, docs/118 path 2): one request, one read of the trips by the index
// trips_from (docs/117).
export const TRIP_DIRECTIONS_PATH = '/trips/directions';
export const TRIP_DAYS_PATH = '/trips/days';
// «Qayerga borasiz?» shows the main directions as cards; any other place by the search.
export const DIRECTION_CARDS = 4;
// «Safarlar» counts the trips of a week: today and the 6 days after it.
export const COUNTED_DAYS = 7;

export const directionsQuerySchema = z.object({ from: locationIdSchema });
export const daysQuerySchema = z.object({ from: locationIdSchema, to: locationIdSchema });

// A card of a direction: the region, the trips today and tomorrow, «… soʻmdan» (the cheapest seat
// of those trips, or the recommended price when there are none).
export const directionCardSchema = z.object({
  to: locationIdSchema,
  today: z.number().int().nonnegative(),
  tomorrow: z.number().int().nonnegative(),
  price: z.number().int().positive(),
});
export type DirectionCard = z.infer<typeof directionCardSchema>;
export const directionCardsSchema = z.object({ directions: z.array(directionCardSchema) });

// The days of «Safarlar» with their trips, and the way: «≈ 300 km · ≈ 5 soat».
export const tripDaySchema = z.object({ date: dateSchema, trips: z.number().int().nonnegative() });
export type TripDay = z.infer<typeof tripDaySchema>;
export const tripDaysSchema = z.object({ km: z.number().int().nonnegative(), days: z.array(tripDaySchema) });
export type TripDays = z.infer<typeof tripDaysSchema>;
