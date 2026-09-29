import type { Offer } from '@platform/contracts';

// A driver's offer on a passenger's request (docs/35): a time and a price per seat.
export type OfferRecord = {
  readonly id: string;
  readonly requestId: string;
  readonly driverId: number;
  readonly departAt: number;
  readonly price: number;
  readonly status: Offer['status'];
  readonly bookingId: string | null;
  readonly createdAt: number;
};

// A sent offer is over when its time passed or the request is not open any more.
export const offerStatusAt = (offer: OfferRecord, requestOpen: boolean, now: number): Offer['status'] =>
  offer.status === 'sent' && (!requestOpen || offer.departAt <= now) ? 'expired' : offer.status;
