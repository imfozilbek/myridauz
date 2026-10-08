import type {
  Booking,
  Car,
  Offer,
  Pitak,
  Point,
  Recommendation,
  RouteError,
  Trip,
  TripInput,
  Rating,
  PickupMode,
  Where,
} from '@platform/contracts';
import type { Person } from '../../users';
import type { BookingRecord } from '../domain/booking';
import type { OfferRecord } from '../domain/offer';
import type { MarkStore, MeetingPorts } from './meeting-ports';
import type { RequestFacts } from './request-facts';

// Ports of the bookings module: D1 in production, memory in tests.
export type BookingRepository = MarkStore & {
  save(booking: BookingRecord): Promise<void>;
  // Saves only if the booking still has the expected status: two answers at once cannot both win.
  replace(booking: BookingRecord, expected: BookingRecord['status']): Promise<boolean>;
  // Confirms only if the seats still fit: two confirms cannot both take the last seat (docs/65 A4).
  confirmWithin(booking: BookingRecord, tripSeats: number): Promise<boolean>;
  find(id: string): Promise<BookingRecord | undefined>;
  byTrips(tripIds: readonly string[]): Promise<BookingRecord[]>;
  byPassenger(passengerId: number): Promise<BookingRecord[]>;
  // The Cron job: requests without an answer in time become expired (docs/35), without points.
  // The requests that were still waiting and are expired now: each passenger is told (docs/83 N03).
  expireOver(now: number): Promise<BookingRecord[]>;
  // The erasure of points (docs/69): which bookings made before this time still keep points.
  keepingPoints(before: number): Promise<{ readonly id: string; readonly tripId: string }[]>;
  erasePoints(ids: readonly string[]): Promise<void>;
  erasePointsOf(passengerId: number): Promise<void>;
};

export type OfferRepository = {
  save(offer: OfferRecord): Promise<void>;
  // Saves only if the offer still has the expected status: an offer is accepted once (docs/65 A4).
  replace(offer: OfferRecord, expected: OfferRecord['status']): Promise<boolean>;
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
  readonly endsAt: number;
  readonly live: boolean;
  readonly over: boolean;
  readonly pickupMode: PickupMode;
  // The plate of the car kept in the trip (docs/65 A1).
  readonly plate: string | null;
};

type Published = { ok: true; value: Trip } | { ok: false; error: string };

export type BookingsDeps = {
  readonly bookings: BookingRepository;
  readonly offers: OfferRepository;
  readonly trips: {
    find(id: string): Promise<TripFacts | undefined>;
    // Ids of the driver's trips, for "Mening safarlarim" with bookings.
    ofDriver(driverId: number): Promise<string[]>;
    // An accepted offer becomes a trip: one the driver makes, within the limit (docs/103).
    scheduleError(
      driverId: number,
      trip: { from: string; to: string; departAt: number; km: number },
    ): Promise<'trips.too_soon' | 'trips.too_many' | 'trips.busy' | null>;
    views(ids: readonly string[]): Promise<Trip[]>;
    publish(driverId: number, input: Required<TripInput>): Promise<Published>;
    cancel(driverId: number, tripId: string): Promise<void>;
  };
  readonly requests: {
    find(id: string): Promise<RequestFacts | undefined>;
    ofPassenger(passengerId: number): Promise<RequestFacts[]>;
    matched(id: string): Promise<void>;
    cancel(passengerId: number, id: string): Promise<void>;
  };
  readonly wallet: {
    commission(price: number, seats: number): number;
    canAfford(driverId: number, amount: number): Promise<boolean>;
    charge(driverId: number, bookingId: string, amount: number): Promise<'ok' | 'not_enough' | 'duplicate'>;
    refund(driverId: number, bookingId: string): Promise<void>;
  };
  readonly people: { find(id: number): Promise<Person | undefined> };
  readonly approvedCar: (driverId: number) => Promise<Car | null>;
  // The ratings of drivers (docs/24, docs/65 C); the bookings this person rated (docs/129).
  readonly ratings: (driverIds: readonly number[]) => Promise<Map<number, Rating>>;
  readonly rated: (userId: number) => Promise<ReadonlySet<string>>;
  readonly recommend: (from: string, to: string) => Promise<Recommended>;
  readonly notify: BookingNotifier;
  // A step of the booking funnel no Mini App sees: a refused or a burned request (docs/89 S2).
  readonly track: (step: 'declined' | 'expired') => void;
  // The names of a point and where a point of a trip may lie (docs/69), from the map module.
  readonly places: {
    describe(point: Point): Promise<Where>;
    fits(point: Point, placeId: string): boolean;
  };
  // The pitak a booking fixed, even if the team closed it later (docs/72).
  readonly pitak: (id: string) => Promise<Pitak | null>;
  // «Kelmadi» and its refund go through the complaints; the live screens (G63).
  readonly meeting: MeetingPorts;
  readonly now: () => number;
  readonly newId: () => string;
};

// Bot messages to the other side (docs/07): a new request, an answer, a cancel, an offer.
export type BookingNotifier = {
  requested(booking: Booking): Promise<void>;
  // The passenger answers this message with the pickup point (docs/14).
  confirmed(booking: Booking): Promise<void>;
  declined(booking: Booking): Promise<void>;
  expired(booking: Booking): Promise<void>;
  cancelled(booking: Booking, by: 'passenger' | 'driver'): Promise<void>;
  // The offer as the passenger sees it: the bot names the driver, the car, the time and the price (G61).
  offered(passengerId: number, offer: Offer): Promise<void>;
  offerAnswered(driverId: number, accepted: boolean, offerId: string): Promise<void>;
  // "Mashinaga chiqdi" and "Yetib keldi" for close people (docs/43); "Men keldim" for the driver (docs/126)
  // and of the driver for the passenger (G63).
  progress(booking: Booking, step: 'boarded' | 'arrived'): Promise<void>;
  came(booking: Booking): Promise<void>;
  driverCame(booking: Booking): Promise<void>;
  // The driver moved the time or lowered the price (G39, docs/104).
  tripRetimed(booking: Booking): Promise<void>;
};

type Recommended =
  { ok: true; value: Recommendation } | { ok: false; error: RouteError | 'locations.not_found' };

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
