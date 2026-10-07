import type { Car, Offer } from '@platform/contracts';

// The car the team approved when the offer was sent: a new check of the driver keeps it (docs/65 A1).
export type OfferCar = Pick<Car, 'make' | 'model' | 'color'>;

// A driver's offer on a passenger's request (docs/35): a time and a price per seat.
export type OfferRecord = {
  readonly id: string;
  readonly requestId: string;
  readonly driverId: number;
  readonly departAt: number;
  readonly price: number;
  // All the car's seats for «Boʻsh salon kerak» (G61); null: the request's seats (offers before G61).
  readonly seats: number | null;
  // null only for an offer of a deleted driver made before the car was kept in the offer.
  readonly car: OfferCar | null;
  readonly status: Offer['status'];
  readonly bookingId: string | null;
  readonly createdAt: number;
};

// A sent offer is over when its time passed or the request is not open any more.
export const offerSeats = (offer: OfferRecord, request: { readonly seats: number }) =>
  offer.seats ?? request.seats;

export const offerStatusAt = (offer: OfferRecord, requestOpen: boolean, now: number): Offer['status'] =>
  offer.status === 'sent' && (!requestOpen || offer.departAt <= now) ? 'expired' : offer.status;
