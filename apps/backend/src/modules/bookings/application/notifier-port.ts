import type { Booking, Offer } from '@platform/contracts';

// Bot messages to the other side (docs/07): a new request, an answer, a cancel, an offer.
export type BookingNotifier = {
  requested(booking: Booking): Promise<void>;
  // The passenger answers this message with the pickup point (docs/14). own: the passenger accepted
  // an offer, nobody rings them about their own step (docs/122 rule 2).
  confirmed(booking: Booking, own?: 'passenger'): Promise<void>;
  declined(booking: Booking): Promise<void>;
  expired(booking: Booking): Promise<void>;
  cancelled(booking: Booking, by: 'passenger' | 'driver'): Promise<void>;
  // The offer as the passenger sees it: the bot names the driver, the car, the time and the price (G61).
  offered(passengerId: number, offer: Offer): Promise<void>;
  // The answer goes to the driver and, as a line, to the chat of the offer (G64: the talk's chat).
  // An accepted offer is a booking of a trip: the ring comes under that trip's card (G68).
  offerAnswered(
    driverId: number,
    accepted: boolean,
    offer: Pick<Offer, 'id' | 'chatKey'>,
    booking?: { readonly id: string; readonly tripId: string },
  ): Promise<void>;
  // "Mashinaga chiqdi" and "Yetib keldi" for close people (docs/43); "Men keldim" for the driver (docs/126)
  // and of the driver for the passenger (G63).
  progress(booking: Booking, step: 'boarded' | 'arrived'): Promise<void>;
  came(booking: Booking): Promise<void>;
  driverCame(booking: Booking): Promise<void>;
  // «Kelmadi» of the driver: the trip card of the passenger says it (G68).
  noShow(booking: Booking): Promise<void>;
  // The driver moved the time or lowered the price (G39, docs/104).
  tripRetimed(booking: Booking): Promise<void>;
};
