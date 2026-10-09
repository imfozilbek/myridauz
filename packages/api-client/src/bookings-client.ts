import {
  ADMIN_TRIPS_PATH,
  bookingSchema,
  bookingsSchema,
  DRIVER_BOOKINGS_PATH,
  DRIVER_OFFERS_PATH,
  driverBookingPath,
  driverMeetPath,
  offerSchema,
  offersSchema,
  PASSENGER_BOOKINGS_PATH,
  PASSENGER_OFFERS_PATH,
  passengerBookingCancelPath,
  passengerOfferPath,
  requestOffersPath,
  requestTalkPath,
  requestTalkSchema,
  requestTripPath,
  salonTripSchema,
  tripBookingsPath,
  type Booking,
  type BookingInput,
  type DriverBookingAction,
  type DriverMeetStep,
  type Offer,
  type OfferAction,
  type OfferInput,
  type SalonTrip,
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
    // The way and the points are fixed at the booking (docs/70).
    book: async (tripId: string, input: BookingInput): Promise<Booking> =>
      booking(await post(tripBookingsPath(tripId), input)),
    myBookings: async (): Promise<Booking[]> => bookings(await request(PASSENGER_BOOKINGS_PATH)),
    cancelMine: async (id: string): Promise<Booking> =>
      booking(await post(passengerBookingCancelPath(id), {})),
    driverBookings: async (): Promise<Booking[]> => bookings(await request(DRIVER_BOOKINGS_PATH)),
    answer: async (id: string, action: DriverBookingAction): Promise<Booking> =>
      booking(await post(driverBookingPath(id, action), {})),
    // The driver at the point (docs/126, G63): «Men keldim», «Keldi», «Kelmadi».
    meet: async (id: string, step: DriverMeetStep): Promise<Booking> =>
      booking(await post(driverMeetPath(id, step), {})),
    tripBookings: async (tripId: string): Promise<Booking[]> =>
      bookings(await request(`${ADMIN_TRIPS_PATH}/${tripId}/bookings`)),
    sendOffer: async (requestId: string, input: OfferInput): Promise<Offer> =>
      offer(await post(requestOffersPath(requestId), input)),
    driverOffers: async (): Promise<Offer[]> => offers(await request(DRIVER_OFFERS_PATH)),
    myOffers: async (): Promise<Offer[]> => offers(await request(PASSENGER_OFFERS_PATH)),
    answerOffer: async (id: string, action: OfferAction): Promise<Offer> =>
      offer(await post(passengerOfferPath(id, action), {})),
    // The chat of a request and this driver, before any offer (G64, docs/118 path 7).
    openTalk: async (requestId: string): Promise<string> =>
      requestTalkSchema.parse(await (await post(requestTalkPath(requestId), {})).json()).chatKey,
    // «Safar ochib taklif qilish» (G64): a trip only this passenger sees, and the offer on it.
    offerSalonTrip: async (requestId: string, departAt: number): Promise<SalonTrip> =>
      salonTripSchema.parse(await (await post(requestTripPath(requestId), { departAt })).json()),
  };
}

export type BookingsClient = ReturnType<typeof createBookingsClient>;
