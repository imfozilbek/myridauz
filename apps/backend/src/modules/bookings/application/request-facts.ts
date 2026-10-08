import type { PickupMode, Point } from '@platform/contracts';

// A passenger's request as the bookings module needs it (docs/35).
export type RequestFacts = {
  readonly id: string;
  readonly passengerId: number;
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly km: number;
  readonly seats: number;
  // The passenger's price of a seat: the salon trip of the request is priced by it (G64).
  readonly price: number;
  // «Boʻsh salon kerak» and «Men bilan ayol bor» (G61): the booking of an accepted offer keeps them.
  readonly wholeCar: boolean;
  readonly withWoman: boolean;
  // The way and the points of the passenger (docs/70): the booking of an accepted offer takes them.
  readonly pickupMode: PickupMode;
  readonly pickup: Point | null;
  readonly dropoff: Point | null;
  readonly open: boolean;
  // The passenger turned the calls of drivers off (G64, docs/127).
  readonly callsOff: boolean;
};
