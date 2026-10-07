import type {
  Car,
  Pitak,
  Point,
  Rating,
  Recommendation,
  RouteError,
  ScheduleRules,
} from '@platform/contracts';
import type { Person } from '../../users';
import type { TripRecord } from '../domain/trip';

// Ports of the trips module: D1 in production, memory in tests.
export type TripRepository = {
  save(trip: TripRecord): Promise<void>;
  find(id: string): Promise<TripRecord | undefined>;
  byDriver(driverId: number): Promise<TripRecord[]>;
  // «Mening safarlarim»: the newest trips of a driver, the trips ahead always among them (G42).
  latestOf(driverId: number, limit: number): Promise<TripRecord[]>;
  // Active trips from these places leaving between the two times, the earliest first.
  leaving(from: number, to: number, places: readonly string[]): Promise<TripRecord[]>;
  // Active or full trips leaving between the two times: their reminders (G10).
  departing(from: number, to: number): Promise<TripRecord[]>;
  // Trips that ended in [from, to), not cancelled: the ratings ask about them (docs/24).
  ended(from: number, to: number): Promise<TripRecord[]>;
  // Every trip leaving in [from, to), whatever its status, the earliest first: a day of the team.
  between(from: number, to: number, limit: number): Promise<TripRecord[]>;
  // Trips that left in [from, to), not cancelled, the latest first: the real prices (docs/09).
  pricedBetween(from: number, to: number, limit: number): Promise<TripRecord[]>;
  // The Cron job: trips over by now become completed (docs/35).
  completeOver(now: number): Promise<void>;
};

// retimed and cheaper: the driver moved the time or lowered the price (G39, docs/104).
export type TripEvent = 'published' | 'updated' | 'retimed' | 'cheaper';

// A confirmed booking holds seats and gives "ayol bor" when a woman rides (docs/06). G08.
// Its points (docs/70) measure the extra way of a new passenger.
export type Rider = {
  readonly tripId: string;
  readonly passengerId: number;
  readonly seats: number;
  // «Men bilan ayol bor» of a man: the trip shows «Mashinada ayol bor» (docs/06 rule 4).
  readonly withWoman: boolean;
  readonly pickup: Point | null;
  readonly dropoff: Point | null;
};

export type TripsDeps = {
  readonly trips: TripRepository;
  readonly riders: (tripIds: readonly string[]) => Promise<readonly Rider[]>;
  readonly people: { find(id: number): Promise<Person | undefined> };
  readonly approvedCar: (driverId: number) => Promise<Car | null>;
  // "⭐ 4,8 (37)" of drivers and the people hidden from search by complaints (docs/17, docs/24).
  readonly ratings: (driverIds: readonly number[]) => Promise<ReadonlyMap<number, Rating>>;
  readonly hidden: (driverIds: readonly number[]) => Promise<ReadonlySet<number>>;
  readonly recommend: (
    from: string,
    to: string,
  ) => Promise<Result<Recommendation, RouteError | 'locations.not_found'>>;
  // The same for a direction that may end in a whole region (G59, «Qayerga borasiz?»).
  readonly recommendDirection: TripsDeps['recommend'];
  // Road km between two places of the driver's trips (docs/103): 0 for the same place.
  readonly roadKm: (from: string, to: string) => Promise<number>;
  readonly schedule: ScheduleRules;
  readonly places: () => Promise<
    ReadonlyMap<string, { id: string; parentId: string | null; oneCity: boolean }>
  >;
  // The driver bot tells about the new trip.
  readonly announce: (trip: TripRecord) => Promise<void>;
  // The main pitak of the direction «region A → region B», when people may see it (docs/72).
  readonly pitakOf: (fromRegion: string, toRegion: string) => Promise<Pitak | null>;
  // A trip was published or changed: channel posts and route subscriptions follow (docs/15, docs/24).
  readonly changed: (tripId: string, event: TripEvent) => Promise<void>;
  // Phones and links hidden in the comment: every searcher reads it (docs/07).
  readonly mask: (text: string) => string;
  readonly newId: () => string;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
