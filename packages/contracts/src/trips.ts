import { z } from 'zod';
import { personIdSchema } from './person-id';
import { ratingSchema } from './ratings';
import { CAR_COLORS, MAX_SEATS } from './drivers';
import { locationIdSchema } from './locations';
import { dateSchema, HOUR_MS } from './tashkent-time';
import { pickupModeSchema, pitakSchema } from './pickup';

// A trip a driver publishes (docs/09, docs/35). G07.
export const DRIVER_TRIPS_PATH = '/driver/trips';
export const driverTripCancelPath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/cancel`;
export const TRIPS_PATH = '/trips';
// The team sees the trips of yesterday, today and later; trips are not approved (owner decision 29.09.2026).
export const ADMIN_TRIPS_PATH = '/admin/trips';
export const tripPath = (id: string) => `${TRIPS_PATH}/${id}`;
// A trip opened for one passenger's request: the driver opens it for everybody (G64, docs/118 path 7).
export const driverTripOpenPath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/open`;
// «Bu oy N safar», «Yoʻl xarajati qaytdi» (G64, docs/118 path 7): this month of Tashkent.
export const DRIVER_MONTH_PATH = `${DRIVER_TRIPS_PATH}/month`;
export const driverMonthSchema = z.object({ trips: z.number().int(), costs: z.number().int() });
export type DriverMonth = z.infer<typeof driverMonthSchema>;

export const TRIP_STATUSES = ['active', 'full', 'completed', 'cancelled'] as const;
// The average speed with stops, measured on the owner's route (decision 29.09.2026):
// Yashnobod → Yakkabogʻ, ≈ 417 km in about 7 hours, that is 60 km/h. The same speed for every route.
const ROAD_KMH = 60;
// The arrival people see is approximate: rounded up to 5 minutes ("≈ 15:00", not "≈ 14:57").
const ARRIVAL_STEP_MS = 5 * 60 * 1000;
// The time on the road of so many km.
export const roadMs = (km: number) => (km / ROAD_KMH) * HOUR_MS;
export const arrivalAt = (departAt: number, km: number) =>
  Math.ceil((departAt + roadMs(km)) / ARRIVAL_STEP_MS) * ARRIVAL_STEP_MS;
// «Qaytish» offers the way back this long after the arrival: the rest of the driver (G63, mockup
// g63/4 screen 16: ≈ 13:00 there, 15:00 back). A proposal of Claude, waits for the owner (docs/10, 46).
export const RETURN_REST_MS = 2 * HOUR_MS;
export const COMMENT_MAX = 200;
const price = z.number().int().min(1);
// How a trip is booked (owner decision 06.10.2026, docs/09, docs/118): seats only, seats or the
// whole car, or only the whole car. The whole car costs seats × the price of a seat; after it
// nobody else rides. The driver chooses at the publishing (G63).
export const BOOKING_RULES = ['seats', 'seats_or_car', 'car_only'] as const;
export type BookingRule = (typeof BOOKING_RULES)[number];

export const tripInputSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  departAt: z.number().int(),
  seats: z.number().int().min(1).max(MAX_SEATS),
  price,
  // "With me goes a woman": a relative without Telegram (docs/06).
  womanOnBoard: z.boolean(),
  comment: z.string().trim().max(COMMENT_MAX),
  // How the driver picks people up (docs/70): the pitak of the direction, around the city, or both.
  pickupMode: pickupModeSchema,
  bookingRule: z.enum(BOOKING_RULES).default('seats'),
});
export type TripInput = z.input<typeof tripInputSchema>;

// What other people see: never the phone (docs/07). The plate shows already before a booking: people
// choose the car with more trust (owner decision 07.10.2026, G59).
export const tripSchema = z.object({
  id: z.string(),
  driver: z.object({
    id: personIdSchema,
    firstName: z.string(),
    hasAvatar: z.boolean(),
    car: z.object({
      make: z.string(),
      model: z.string(),
      color: z.enum(CAR_COLORS),
      plate: z.string().default(''),
    }),
    // "⭐ 4,8 (37)" or "Yangi" (docs/24, G11).
    rating: ratingSchema,
  }),
  from: locationIdSchema,
  to: locationIdSchema,
  departAt: z.number().int(),
  km: z.number().int(),
  seats: z.number().int(),
  // Seats not taken by confirmed bookings (G08).
  seatsLeft: z.number().int(),
  price,
  // The time and the price at the publishing: the driver moves the time up to +1 hour from it and
  // only lowers the price; a lower price shows as «Narxi tushdi» (G39, docs/104).
  firstDepartAt: z.number().int(),
  firstPrice: price,
  // The recommended price of the route next to the driver's price (docs/40, question 44). G18.
  recommendedPrice: z.number().int().nullable(),
  // "Mashinada ayol bor": set by itself (docs/06).
  woman: z.boolean(),
  pickupMode: pickupModeSchema,
  // The fields of G59 have defaults: an answer of the server before the deploy still opens the screen.
  bookingRule: z.enum(BOOKING_RULES).default('seats'),
  // The main pitak of the direction, when the driver takes people there (docs/70, docs/72).
  pitak: pitakSchema.nullable(),
  comment: z.string(),
  status: z.enum(TRIP_STATUSES),
  // «Yoʻlga chiqdim» and «Yetib keldik» of the driver (G63, docs/35); an older answer has neither.
  departedAt: z.number().int().nullable().default(null),
  arrivedAt: z.number().int().nullable().default(null),
  // Opened from a «Boʻsh salon kerak» request (G64): only that passenger sees it until the answer.
  private: z.boolean().default(false),
});
export type Trip = z.infer<typeof tripSchema>;
export const tripsSchema = z.object({ trips: z.array(tripSchema) });

// Search: from and to may be a region (all its places) or a place (docs/14). The points of the
// passenger come only at the booking (G26, docs/74): the search has none.

export const tripSearchSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  date: dateSchema,
  woman: z.enum(['1']).optional(),
});
export type TripSearch = z.infer<typeof tripSearchSchema>;
