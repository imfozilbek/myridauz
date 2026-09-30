import { z } from 'zod';
import { personIdSchema } from './person-id';
import { MAX_SEATS } from './drivers';
import { tripSchema } from './trips';
import { pointInputSchema } from './point';
import { bookedPlaceSchema, bookingModeSchema, pitakSchema } from './pickup';

// A seat booking (docs/35): a passenger asks, the driver confirms; or the driver offers on a
// request and the passenger accepts. G08. Direct contacts are never part of it (docs/07).
export const PASSENGER_BOOKINGS_PATH = '/passenger/bookings';
export const tripBookingsPath = (tripId: string) => `/trips/${tripId}/bookings`;
export const passengerBookingCancelPath = (id: string) => `${PASSENGER_BOOKINGS_PATH}/${id}/cancel`;
export const DRIVER_BOOKINGS_PATH = '/driver/bookings';
export const DRIVER_BOOKING_ACTIONS = ['confirm', 'decline', 'cancel'] as const;
export type DriverBookingAction = (typeof DRIVER_BOOKING_ACTIONS)[number];
export const driverBookingPath = (id: string, action: DriverBookingAction) =>
  `${DRIVER_BOOKINGS_PATH}/${id}/${action}`;

export const BOOKING_STATUSES = [
  'requested',
  'confirmed',
  'completed',
  'declined',
  'expired',
  'cancelled_by_passenger',
  'cancelled_by_driver',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
// A passenger waits for at most this many answers at once (docs/35).
export const MAX_REQUESTED_BOOKINGS = 3;
// A request without an answer expires after this time or at the departure (docs/35).
export const BOOKING_ANSWER_HOURS = 24;

// A booking fixes how the passenger is picked up and where they go (docs/70): from the pitak of
// the direction, or from the door with a point; the drop-off is always a point at the door.
export const bookingInputSchema = z.object({
  seats: z.number().int().min(1).max(MAX_SEATS),
  mode: bookingModeSchema,
  pickup: pointInputSchema.nullable(),
  dropoff: pointInputSchema,
});
export type BookingInput = z.input<typeof bookingInputSchema>;

// The other side sees the name and the photo by docs/05, never a phone or a username.
// Places and the plate open only after the confirmation (docs/07, docs/14).
export const bookingSchema = z.object({
  id: z.string(),
  trip: tripSchema,
  passenger: z.object({ id: personIdSchema, firstName: z.string(), hasAvatar: z.boolean() }),
  seats: z.number().int(),
  // The driver's share per seat and the driver's commission for the whole booking (docs/12).
  price: z.number().int(),
  commission: z.number().int(),
  status: z.enum(BOOKING_STATUSES),
  createdAt: z.number().int(),
  // Until when the driver answers a request (docs/35): the driver sees the deadline (docs/65 C).
  expiresAt: z.number().int(),
  // Fixed at the booking (docs/70). The driver sees the area of the points until the confirmation,
  // then the points; everything is erased 30 days after the trip (docs/69).
  mode: bookingModeSchema.nullable(),
  pitak: pitakSchema.nullable(),
  pickup: bookedPlaceSchema.nullable(),
  dropoff: bookedPlaceSchema.nullable(),
  // For the driver, on a request: the km this passenger adds to the confirmed ones (docs/70).
  extraKm: z.number().int().nullable(),
  plate: z.string().nullable(),
  // The chat of the booking (docs/07): the offer's chat when it came from an offer.
  chatKey: z.string(),
  // "Mashinaga chiqdim" and "Yetib keldim" of the passenger (docs/43).
  boardedAt: z.number().int().nullable(),
  arrivedAt: z.number().int().nullable(),
});
export type Booking = z.infer<typeof bookingSchema>;
export const bookingsSchema = z.object({ bookings: z.array(bookingSchema) });
