import { z } from 'zod';
import { personIdSchema } from './person-id';
import { CAR_COLORS } from './drivers';
import { locationIdSchema } from './locations';
import { ratingSchema } from './ratings';
import { DRIVER_REQUESTS_PATH } from './ride-requests';
import { tripSchema } from './trips';

// The second way to a booking (docs/35): a driver offers a time and a price on a passenger's
// request; when the passenger accepts, the driver gets a trip with these seats. G08.
export const requestOffersPath = (requestId: string) => `${DRIVER_REQUESTS_PATH}/${requestId}/offers`;
export const DRIVER_OFFERS_PATH = '/driver/offers';
export const PASSENGER_OFFERS_PATH = '/passenger/offers';
export const OFFER_ACTIONS = ['accept', 'decline'] as const;
export type OfferAction = (typeof OFFER_ACTIONS)[number];
export const passengerOfferPath = (id: string, action: OfferAction) =>
  `${PASSENGER_OFFERS_PATH}/${id}/${action}`;

export const OFFER_STATUSES = ['sent', 'accepted', 'declined', 'expired'] as const;

// tripId: «Safarimga taklif qilish» (G64): the time and the price are the trip's, the booking goes
// on that trip when the passenger accepts.
export const offerInputSchema = z.object({
  departAt: z.number().int(),
  price: z.number().int().min(1),
  tripId: z.string().uuid().optional(),
});
export type OfferInput = z.input<typeof offerInputSchema>;

export const offerSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  driver: z.object({
    id: personIdSchema,
    firstName: z.string(),
    hasAvatar: z.boolean(),
    // The plate shows before the answer, as on a trip (G61); null for an offer sent before G61.
    car: z.object({
      make: z.string(),
      model: z.string(),
      color: z.enum(CAR_COLORS),
      plate: z.string().nullable(),
    }),
    // "⭐ 4,8 (37)" or "Yangi": the passenger chooses a driver by it (docs/24, docs/65 C).
    rating: ratingSchema,
  }),
  from: locationIdSchema,
  to: locationIdSchema,
  departAt: z.number().int(),
  km: z.number().int(),
  seats: z.number().int(),
  // «Boʻsh salon kerak» (G61): the seats are all the seats of the car.
  wholeCar: z.boolean(),
  price: z.number().int(),
  commission: z.number().int(),
  status: z.enum(OFFER_STATUSES),
  // The booking made when the passenger accepted.
  bookingId: z.string().nullable(),
  chatKey: z.string(),
  // The trip the offer goes on (G64): a trip of the driver, or one opened for this request.
  tripId: z.string().nullable().default(null),
  // Where the driver picks up: the pitak's name, or null from the door (G64, cards in chat and call).
  pitak: z.string().nullable().default(null),
  createdAt: z.number().int().default(0),
});
export type Offer = z.infer<typeof offerSchema>;
export const offersSchema = z.object({ offers: z.array(offerSchema) });

// «Safar ochib taklif qilish» (G64, docs/118 path 7): a trip for the whole car from a «Boʻsh salon
// kerak» request, seen only by this passenger until the answer, and the offer on it.
export const requestTripPath = (requestId: string) => `${DRIVER_REQUESTS_PATH}/${requestId}/trip`;
export const requestTripInputSchema = z.object({ departAt: z.number().int() });
export const salonTripSchema = z.object({ trip: tripSchema, offer: offerSchema });
export type SalonTrip = z.infer<typeof salonTripSchema>;
