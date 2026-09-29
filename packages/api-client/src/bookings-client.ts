import {
  ADMIN_TRIPS_PATH,
  bookingSchema,
  bookingsSchema,
  DRIVER_BOOKINGS_PATH,
  DRIVER_OFFERS_PATH,
  driverBookingPath,
  offerSchema,
  offersSchema,
  PASSENGER_BOOKINGS_PATH,
  PASSENGER_OFFERS_PATH,
  passengerBookingCancelPath,
  passengerOfferPath,
  requestOffersPath,
  tripBookingsPath,
  type Booking,
  type DriverBookingAction,
  type Offer,
  type OfferAction,
  type OfferInput,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// Bookings and drivers' offers (docs/35, G08), for the three Mini Apps.
export function createBookingsClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const booking = async (response: Response) => bookingSchema.parse(await response.json());
  const bookings = async (response: Response) => bookingsSchema.parse(await response.json()).bookings;
  const offer = async (response: Response) => offerSchema.parse(await response.json());
  const offers = async (response: Response) => offersSchema.parse(await response.json()).offers;
  return {
    book: async (tripId: string, seats: number): Promise<Booking> =>
      booking(await post(tripBookingsPath(tripId), { seats })),
    myBookings: async (): Promise<Booking[]> => bookings(await request(PASSENGER_BOOKINGS_PATH)),
    cancelMine: async (id: string): Promise<Booking> => booking(await post(passengerBookingCancelPath(id), {})),
    driverBookings: async (): Promise<Booking[]> => bookings(await request(DRIVER_BOOKINGS_PATH)),
    answer: async (id: string, action: DriverBookingAction): Promise<Booking> =>
      booking(await post(driverBookingPath(id, action), {})),
    tripBookings: async (tripId: string): Promise<Booking[]> =>
      bookings(await request(`${ADMIN_TRIPS_PATH}/${tripId}/bookings`)),
    sendOffer: async (requestId: string, input: OfferInput): Promise<Offer> =>
      offer(await post(requestOffersPath(requestId), input)),
    driverOffers: async (): Promise<Offer[]> => offers(await request(DRIVER_OFFERS_PATH)),
    myOffers: async (): Promise<Offer[]> => offers(await request(PASSENGER_OFFERS_PATH)),
    answerOffer: async (id: string, action: OfferAction): Promise<Offer> =>
      offer(await post(passengerOfferPath(id, action), {})),
  };
}

export type BookingsClient = ReturnType<typeof createBookingsClient>;
