import type {
  Car,
  Pitak,
  Point,
  Recommendation,
  RouteError,
  Trip,
  TripInput,
  Rating,
  RideRequest,
  PickupMode,
  Where,
} from '@platform/contracts';
import type { Person } from '../../users';
import type { BookingRecord } from '../domain/booking';
import type { MarkStore, MeetingPorts } from './meeting-ports';
import type { BookingNotifier } from './notifier-port';
import type { OfferRepository, TalkRepository } from './offer-ports';
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
  // Requests still waiting that passed half of their time to answer since `since`: the driver is
  // asked once more (G68). The window keeps the Cron from reading the same requests every tick.
  waitingPastHalf(now: number, since: number): Promise<BookingRecord[]>;
  // The erasure of points (docs/69): which bookings made before this time still keep points.
  keepingPoints(before: number): Promise<{ readonly id: string; readonly tripId: string }[]>;
  erasePoints(ids: readonly string[]): Promise<void>;
  erasePointsOf(passengerId: number): Promise<void>;
};

export type { OfferRepository } from './offer-ports';
export type { BookingNotifier } from './notifier-port';

// What bookings need of a trip (the trips module owns it).
export type TripFacts = {
  readonly id: string;
  readonly driverId: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
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

export type BookingsDeps = {
  readonly bookings: BookingRepository;
  readonly offers: OfferRepository;
  readonly talks: TalkRepository;
  // How many times a driver rings about one request before a booking (brand, G64).
  readonly requestRings: number;
  readonly trips: {
    find(id: string): Promise<TripFacts | undefined>;
    // Ids of the driver's trips, for "Mening safarlarim" with bookings.
    ofDriver(driverId: number): Promise<string[]>;
    // An accepted offer becomes a trip: one the driver makes, within the limit (docs/103). Its way
    // is the trips module's: both where the direction has a pitak, else the door (docs/70).
    scheduleError(
      driverId: number,
      trip: { from: string; to: string; departAt: number; km: number },
    ): Promise<'trips.too_soon' | 'trips.too_many' | 'trips.busy' | null>;
    views(ids: readonly string[]): Promise<Trip[]>;
    publish(driverId: number, input: Omit<Required<TripInput>, 'pickupMode'>): Promise<Published>;
    // «Safar ochib taklif qilish» (G64): a trip only the passenger of the request sees; opened for
    // everybody by the driver, or released as an ordinary trip once the passenger takes it.
    publishPrivate(driverId: number, input: Required<TripInput>, requestId: string): Promise<Published>;
    open(driverId: number, tripId: string): Promise<Published>;
    release(tripId: string): Promise<void>;
    cancel(driverId: number, tripId: string): Promise<void>;
  };
  readonly requests: {
    find(id: string): Promise<RequestFacts | undefined>;
    // The request as drivers see it, on top of a talk (G64).
    view(id: string): Promise<RideRequest | undefined>;
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
  // The contacts of a text masked, as in the chat (docs/07): the note of a booking.
  readonly mask: (text: string) => string;
  readonly now: () => number;
  readonly newId: () => string;
};

type Recommended =
  { ok: true; value: Recommendation } | { ok: false; error: RouteError | 'locations.not_found' };

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
