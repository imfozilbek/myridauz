import { z } from 'zod';
import { personIdSchema } from './person-id';
import { MAX_SEATS } from './drivers';
import { tripSchema } from './trips';
import { pointInputSchema } from './point';
import { ratingSchema } from './ratings';
import { bookedPlaceSchema, bookingModeSchema, pitakSchema } from './pickup';
import { complaintRefundSchema } from './complaints';
import { MINUTE_MS } from './team-hours';

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
// The seats go up to the free seats of the trip (owner decision 06.10.2026, docs/128 §2). The whole
// car takes every seat of the trip (docs/09). «Men bilan ayol bor»: a man with 2 seats and more says
// a woman rides with him, and the trip shows «Mashinada ayol bor» once confirmed (docs/06, rule 4).
// The note of the passenger for the driver at the meeting («Qizil kurtka, sumka bilan», mockup
// g63/4 screen 13): short, without contacts (docs/07), gone with the points (docs/69).
export const BOOKING_NOTE_MAX = 60;

export const bookingInputSchema = z.object({
  seats: z.number().int().min(1).max(MAX_SEATS),
  mode: bookingModeSchema,
  pickup: pointInputSchema.nullable(),
  dropoff: pointInputSchema,
  wholeCar: z.boolean().default(false),
  withWoman: z.boolean().default(false),
  note: z.string().trim().max(BOOKING_NOTE_MAX).default(''),
});
export type BookingInput = z.input<typeof bookingInputSchema>;

// The other side sees the name and the photo by docs/05, never a phone or a username.
// The places open only after the confirmation (docs/07, docs/14).
// The meeting card and «Men keldim» open this long before the departure (docs/126).
export const MEET_BEFORE_MINUTES = 30;
// The meeting at the point opens then, for both sides: the passenger, the driver and the server.
export const meetingStartsAt = (departAt: number) => departAt - MEET_BEFORE_MINUTES * MINUTE_MS;

export const bookingSchema = z.object({
  id: z.string(),
  trip: tripSchema,
  passenger: z.object({
    id: personIdSchema,
    firstName: z.string(),
    hasAvatar: z.boolean(),
    // The driver decides on a request by it too (mockup g63/3): only the driver's view has it.
    rating: ratingSchema.optional(),
  }),
  seats: z.number().int(),
  wholeCar: z.boolean().default(false),
  withWoman: z.boolean().default(false),
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
  // The note of the passenger, seen with the exact points (BOOKING_NOTE_MAX).
  note: z.string().nullable().default(null),
  // For the driver, on a request: the km this passenger adds to the confirmed ones (docs/70).
  extraKm: z.number().int().nullable(),
  plate: z.string().nullable(),
  // The chat of the booking (docs/07): the offer's chat when it came from an offer.
  chatKey: z.string(),
  // The messages of the other side not read yet in this chat; only the list of the passenger (G53).
  unread: z.number().int().nonnegative().optional(),
  // For the passenger, after the trip: the rating is given already (docs/129, «Oʻtgan»).
  rated: z.boolean().optional(),
  // When the driver confirmed it (docs/88 L6), "Mashinaga chiqdim" and "Yetib keldim" (docs/43).
  confirmedAt: z.number().int().nullable(),
  boardedAt: z.number().int().nullable(),
  arrivedAt: z.number().int().nullable(),
  // «Men keldim» of the passenger at the meeting point (docs/126).
  cameAt: z.number().int().nullable().default(null),
  // The driver at the point: «Men keldim», then «Keldi» or «Kelmadi» (docs/126, G63).
  driverCameAt: z.number().int().nullable().default(null),
  metAt: z.number().int().nullable().default(null),
  noShowAt: z.number().int().nullable().default(null),
  // Only for the driver: the refund of the commission of a no-show (docs/35, docs/129). null while
  // the team decides; "rejected" also when the team decided without a refund.
  refund: complaintRefundSchema.nullable().default(null),
});
export type Booking = z.infer<typeof bookingSchema>;
export const bookingsSchema = z.object({ bookings: z.array(bookingSchema) });
