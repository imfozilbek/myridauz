import { z } from 'zod';
import { personIdSchema } from './person-id';
import { locationIdSchema } from './locations';
import { dateSchema } from './tashkent-time';
import { pickupModeSchema } from './pickup';
import { pointInputSchema } from './point';

// "Ищу поездку": a request a passenger publishes, drivers find it (docs/09, docs/35). G07.
export const PASSENGER_REQUESTS_PATH = '/passenger/requests';
export const passengerRequestCancelPath = (id: string) => `${PASSENGER_REQUESTS_PATH}/${id}/cancel`;
export const DRIVER_REQUESTS_PATH = '/driver/requests';

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
  passenger: z.object({ id: personIdSchema, firstName: z.string(), hasAvatar: z.boolean() }),
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
});
export type RideRequest = z.infer<typeof rideRequestSchema>;
export const rideRequestsSchema = z.object({ requests: z.array(rideRequestSchema) });

export const requestSearchSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  date: dateSchema,
});
export type RequestSearch = z.infer<typeof requestSearchSchema>;
