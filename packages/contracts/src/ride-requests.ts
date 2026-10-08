import { z } from 'zod';
import { personIdSchema } from './person-id';
import { locationIdSchema } from './locations';
import { dateSchema } from './tashkent-time';
import { pickupModeSchema } from './pickup';
import { pointInputSchema } from './point';
import { ratingSchema } from './ratings';
import { tripSchema } from './trips';

// "Ищу поездку": a request a passenger publishes, drivers find it (docs/09, docs/35). G07.
export const PASSENGER_REQUESTS_PATH = '/passenger/requests';
export const passengerRequestCancelPath = (id: string) => `${PASSENGER_REQUESTS_PATH}/${id}/cancel`;
export const DRIVER_REQUESTS_PATH = '/driver/requests';
// The passenger turns the calls of drivers about a request off and on (G64, docs/127).
export const passengerRequestCallsPath = (id: string) => `${PASSENGER_REQUESTS_PATH}/${id}/calls`;
export const requestCallsInputSchema = z.object({ on: z.boolean() });

export const REQUEST_STATUSES = ['open', 'matched', 'expired', 'cancelled'] as const;
export const MAX_OPEN_REQUESTS = 3;
export const REQUEST_MAX_SEATS = 4;

export const rideRequestInputSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  date: dateSchema,
  seats: z.number().int().min(1).max(REQUEST_MAX_SEATS),
  price: z.number().int().min(1),
  // How the passenger wants to be picked up and where they go (docs/70): the start point is
  // needed unless only the pitak suits; the drop-off point always.
  pickupMode: pickupModeSchema,
  pickup: pointInputSchema.nullable(),
  dropoff: pointInputSchema,
  // «Boʻsh salon kerak»: the group takes the whole car; «Men bilan ayol bor» of a man with 2 people
  // and more (G61, docs/06 rule 4, docs/118 path 4).
  wholeCar: z.boolean().default(false),
  withWoman: z.boolean().default(false),
});
export type RideRequestInput = z.input<typeof rideRequestInputSchema>;
export type RideRequestData = z.output<typeof rideRequestInputSchema>;

export const rideRequestSchema = z.object({
  id: z.string(),
  // The rating shows to drivers on the card (G64, docs/24); missing from an older server.
  passenger: z.object({
    id: personIdSchema,
    firstName: z.string(),
    hasAvatar: z.boolean(),
    rating: ratingSchema.optional(),
  }),
  from: locationIdSchema,
  to: locationIdSchema,
  date: dateSchema,
  km: z.number().int(),
  seats: z.number().int(),
  price: z.number().int(),
  pickupMode: pickupModeSchema,
  wholeCar: z.boolean(),
  withWoman: z.boolean(),
  status: z.enum(REQUEST_STATUSES),
  // Drivers may call about the request before a booking unless the passenger turned it off (G64).
  callsOff: z.boolean().default(false),
});
export type RideRequest = z.infer<typeof rideRequestSchema>;
export const rideRequestsSchema = z.object({ requests: z.array(rideRequestSchema) });

export const requestSearchSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  date: dateSchema,
});
export type RequestSearch = z.infer<typeof requestSearchSchema>;

// «Yoʻlovchilar soʻrovlari» (G64, docs/118 path 7): the requests of a day on the directions of the
// driver, the days with their counts. With a live trip of the driver: the requests of its day that
// fit it («Safaringizga mos», with the extra km), then the others. known: false when the driver has
// no direction yet (no trips, no subscriptions): the route is asked first.
export const DRIVER_REQUESTS_BOARD_PATH = `${DRIVER_REQUESTS_PATH}/board`;
export const requestBoardQuerySchema = z.object({
  date: dateSchema.optional(),
  from: locationIdSchema.optional(),
  to: locationIdSchema.optional(),
});
export type RequestBoardQuery = z.infer<typeof requestBoardQuerySchema>;
export const requestBoardSchema = z.object({
  known: z.boolean(),
  date: dateSchema,
  days: z.array(z.object({ date: dateSchema, count: z.number().int() })),
  trip: tripSchema.nullable(),
  fits: z.array(rideRequestSchema.extend({ extraKm: z.number().int() })),
  others: z.array(rideRequestSchema),
});
export type RequestBoard = z.infer<typeof requestBoardSchema>;
