import type { PickupMode, Trip, TripInput } from '@platform/contracts';

// What bookings need of a trip (the trips module owns it).
export type TripFacts = {
  readonly id: string;
  readonly driverId: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // The end of a range of the time (docs/216); null: one exact time.
  readonly departUntil: number | null;
  // «Yoʻlga chiqdim» of the driver (G63): the trip is on the road even before its time.
  readonly departedAt: number | null;
  // «Yetib keldik» of the driver (G63): the ride is over for the stars before the trip closes.
  readonly arrivedAt: number | null;
  readonly km: number;
  readonly seats: number;
  readonly price: number;
  readonly endsAt: number;
  readonly live: boolean;
  readonly over: boolean;
  readonly pickupMode: PickupMode;
  // The plate of the car kept in the trip (docs/65 A1).
  readonly plate: string | null;
};

type Published = { ok: true; value: Trip } | { ok: false; error: string };
type OfferTripInput = Omit<Required<TripInput>, 'pickupMode' | 'departUntil'>;

// The trips of the driver as bookings use them (the trips module owns them).
export type TripsPort = {
  find(id: string): Promise<TripFacts | undefined>;
  // Ids of the driver's trips, for "Mening safarlarim" with bookings.
  ofDriver(driverId: number): Promise<string[]>;
  // An accepted offer becomes a trip: in time and the driver's only live one (docs/103, docs/172).
  // Its way is the trips module's: both where the direction has a pitak, else the door (docs/70).
  scheduleError(driverId: number, departAt: number): Promise<'trips.too_soon' | 'trips.too_many' | null>;
  views(ids: readonly string[]): Promise<Trip[]>;
  // Quiet until the seat is taken: then opened or released (G89 T12). An offer has one exact time,
  // never a range (docs/216).
  publish(driverId: number, input: OfferTripInput, requestId: string): Promise<Published>;
  // «Safar ochib taklif qilish» (G64): a trip only the passenger of the request sees; opened for
  // everybody by the driver, or released as an ordinary trip once the passenger takes it.
  publishPrivate(
    driverId: number,
    input: OfferTripInput & Pick<Required<TripInput>, 'pickupMode'>,
    requestId: string,
  ): Promise<Published>;
  open(driverId: number, tripId: string): Promise<Published>;
  release(tripId: string): Promise<void>;
  // False when the trip is already on its way or over (docs/35).
  cancel(driverId: number, tripId: string): Promise<boolean>;
  // Cancelled trips leaving after this time: the hourly repair ends their seats (G89 T2).
  cancelledAfter(after: number): Promise<string[]>;
};
