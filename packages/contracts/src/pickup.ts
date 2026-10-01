import { z } from 'zod';
import { pointSchema } from './point';
import { placeNameSchema } from './map-where';

// How a passenger is picked up (G24, docs/70): from a pitak, from the door or both. Only the start
// has a pitak; the end is always at the door. A trip and a request name every way that suits them;
// a booking keeps the one way chosen at the booking and never changes it.
export const PICKUP_MODES = ['pitak', 'door', 'both'] as const;
export type PickupMode = (typeof PICKUP_MODES)[number];
export const BOOKING_MODES = ['pitak', 'door'] as const;
export type BookingMode = (typeof BOOKING_MODES)[number];
export const pickupModeSchema = z.enum(PICKUP_MODES);
export const bookingModeSchema = z.enum(BOOKING_MODES);

const allows = (mode: PickupMode, way: BookingMode) => mode === 'both' || mode === way;

// The ways a booking of this passenger on this trip may take (the table of docs/70): none means
// the trip does not suit; two means the passenger chooses at the booking.
export const commonModes = (trip: PickupMode, passenger: PickupMode): BookingMode[] =>
  BOOKING_MODES.filter((way) => allows(trip, way) && allows(passenger, way));

// A pitak as people see it: the system takes the main pitak of the direction by itself.
export const pitakSchema = z.object({ id: z.string(), name: z.string(), point: pointSchema });
export type Pitak = z.infer<typeof pitakSchema>;

// A point of a booking with its names (docs/69). The driver sees only the area until the
// confirmation: the point and the exact name are null for them (docs/70).
export const bookedPlaceSchema = z.object({
  point: pointSchema.nullable(),
  name: placeNameSchema.nullable(),
  area: placeNameSchema.nullable(),
});
export type BookedPlace = z.infer<typeof bookedPlaceSchema>;
