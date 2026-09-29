import { z } from 'zod';
import { CAR_COLORS, MAX_SEATS } from './drivers';
import { locationIdSchema } from './locations';
import { dateSchema } from './tashkent-time';

// A trip a driver publishes (docs/09, docs/35). G07.
export const DRIVER_TRIPS_PATH = '/driver/trips';
export const driverTripCancelPath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/cancel`;
export const TRIPS_PATH = '/trips';
// The team sees the trips of yesterday, today and later; trips are not approved (owner decision 29.09.2026).
export const ADMIN_TRIPS_PATH = '/admin/trips';
export const tripPath = (id: string) => `${TRIPS_PATH}/${id}`;

export const TRIP_STATUSES = ['active', 'full', 'completed', 'cancelled'] as const;
export const MAX_ACTIVE_TRIPS = 5;
// An average speed on Uzbek roads: the arrival shown to people is approximate ("≈ 17:30").
const ROAD_KMH = 60;
const HOUR_MS = 60 * 60 * 1000;
export const arrivalAt = (departAt: number, km: number) => departAt + Math.ceil((km / ROAD_KMH) * HOUR_MS);
// A trip is published at most this far ahead.
export const TRIP_DAYS_AHEAD = 30;
export const COMMENT_MAX = 200;
const price = z.number().int().min(1);

export const tripInputSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  departAt: z.number().int(),
  seats: z.number().int().min(1).max(MAX_SEATS),
  price,
  // "With me goes a woman": a relative without Telegram (docs/06).
  womanOnBoard: z.boolean(),
  comment: z.string().trim().max(COMMENT_MAX),
});
export type TripInput = z.input<typeof tripInputSchema>;

// What other people see: never the plate or the phone before a booking (docs/07, docs/14).
export const tripSchema = z.object({
  id: z.string(),
  driver: z.object({
    id: z.number().int(),
    firstName: z.string(),
    hasAvatar: z.boolean(),
    car: z.object({ make: z.string(), model: z.string(), color: z.enum(CAR_COLORS) }),
  }),
  from: locationIdSchema,
  to: locationIdSchema,
  departAt: z.number().int(),
  km: z.number().int(),
  seats: z.number().int(),
  price,
  // "Mashinada ayol bor": set by itself (docs/06).
  woman: z.boolean(),
  hasMeetingPoint: z.boolean(),
  comment: z.string(),
  status: z.enum(TRIP_STATUSES),
});
export type Trip = z.infer<typeof tripSchema>;
export const tripsSchema = z.object({ trips: z.array(tripSchema) });

// Search: from and to may be a region (all its places) or a place (docs/14).
export const tripSearchSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  date: dateSchema,
  woman: z.enum(['1']).optional(),
});
export type TripSearch = z.infer<typeof tripSearchSchema>;
