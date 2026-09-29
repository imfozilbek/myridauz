import type { Booking, Car, Point, Recommendation, RouteError, Trip, TripInput } from '@platform/contracts';
import type { Person } from '../../users';
import type { BookingRecord } from '../domain/booking';
import type { OfferRecord } from '../domain/offer';

// Ports of the bookings module: D1 in production, memory in tests.
export type BookingRepository = {
  save(booking: BookingRecord): Promise<void>;
  // Saves only if the booking still has the expected status: two answers at once cannot both win.
  replace(booking: BookingRecord, expected: BookingRecord['status']): Promise<boolean>;
  find(id: string): Promise<BookingRecord | undefined>;
  byTrips(tripIds: readonly string[]): Promise<BookingRecord[]>;
  byPassenger(passengerId: number): Promise<BookingRecord[]>;
  byPickupMessage(passengerId: number, messageId: number): Promise<BookingRecord | undefined>;
  // The Cron job: requests without an answer in time become expired (docs/35).
  expireOver(now: number): Promise<void>;
};

export type OfferRepository = {
  save(offer: OfferRecord): Promise<void>;
  find(id: string): Promise<OfferRecord | undefined>;
  byRequests(requestIds: readonly string[]): Promise<OfferRecord[]>;
  byDriver(driverId: number): Promise<OfferRecord[]>;
};

// What bookings need of a trip (the trips module owns it).
export type TripFacts = {
  readonly id: string;
  readonly driverId: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  readonly km: number;
  readonly seats: number;
  readonly price: number;
  readonly live: boolean;
  readonly over: boolean;
  readonly meetingPoint: Point | null;
};
export type RequestFacts = {
  readonly id: string;
  readonly passengerId: number;
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly km: number;
  readonly seats: number;
  readonly open: boolean;
};

type Published = { ok: true; value: Trip } | { ok: false; error: string };

export type BookingsDeps = {
  readonly bookings: BookingRepository;
  readonly offers: OfferRepository;
  readonly trips: {
    find(id: string): Promise<TripFacts | undefined>;
    // Ids of the driver's trips, for "Mening safarlarim" with bookings.
    ofDriver(driverId: number): Promise<string[]>;
    views(ids: readonly string[]): Promise<Trip[]>;
    publish(driverId: number, input: Required<TripInput>): Promise<Published>;
    cancel(driverId: number, tripId: string): Promise<void>;
  };
  readonly requests: {
    find(id: string): Promise<RequestFacts | undefined>;
    ofPassenger(passengerId: number): Promise<RequestFacts[]>;
    matched(id: string): Promise<void>;
  };
  readonly wallet: {
    commission(price: number, seats: number): number;
    canAfford(driverId: number, amount: number): Promise<boolean>;
    charge(driverId: number, bookingId: string, amount: number): Promise<'ok' | 'not_enough' | 'duplicate'>;
    refund(driverId: number, bookingId: string): Promise<void>;
  };
  readonly people: { find(id: number): Promise<Person | undefined> };
  readonly approvedCar: (driverId: number) => Promise<Car | null>;
  readonly recommend: (
    from: string,
    to: string,
  ) => Promise<
    { ok: true; value: Recommendation } | { ok: false; error: RouteError | 'locations.not_found' }
  >;
  readonly notify: BookingNotifier;
  readonly now: () => number;
  readonly newId: () => string;
};

// Bot messages to the other side (docs/07): a new request, an answer, a cancel, an offer.
export type BookingNotifier = {
  requested(booking: Booking): Promise<void>;
  // The passenger answers this message with the pickup point (docs/14).
  confirmed(booking: Booking): Promise<void>;
  declined(booking: Booking): Promise<void>;
  cancelled(booking: Booking, by: 'passenger' | 'driver'): Promise<void>;
  offered(passengerId: number, offerId: string): Promise<void>;
  offerAnswered(driverId: number, accepted: boolean, offerId: string): Promise<void>;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
