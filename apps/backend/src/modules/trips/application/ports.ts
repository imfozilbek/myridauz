import type { Car, Recommendation, RouteError } from '@platform/contracts';
import type { Person } from '../../users';
import type { TripRecord } from '../domain/trip';

// Ports of the trips module: D1 in production, memory in tests.
export type TripRepository = {
  save(trip: TripRecord): Promise<void>;
  find(id: string): Promise<TripRecord | undefined>;
  byDriver(driverId: number): Promise<TripRecord[]>;
  byMeetingMessage(driverId: number, messageId: number): Promise<TripRecord | undefined>;
  // Active trips leaving between the two times, the earliest first.
  leaving(from: number, to: number): Promise<TripRecord[]>;
  // Every trip leaving from this time on, whatever its status, the earliest first (the team's list).
  since(from: number, limit: number): Promise<TripRecord[]>;
  // The Cron job: trips over by now become completed (docs/35).
  completeOver(now: number): Promise<void>;
};

export type TripEvent = 'published' | 'updated';

// A confirmed booking holds seats and gives "ayol bor" when a woman rides (docs/06). G08.
export type Rider = { readonly tripId: string; readonly passengerId: number; readonly seats: number };

export type TripsDeps = {
  readonly trips: TripRepository;
  readonly riders: (tripIds: readonly string[]) => Promise<readonly Rider[]>;
  readonly people: { find(id: number): Promise<Person | undefined> };
  readonly approvedCar: (driverId: number) => Promise<Car | null>;
  readonly recommend: (
    from: string,
    to: string,
  ) => Promise<Result<Recommendation, RouteError | 'locations.not_found'>>;
  readonly places: () => Promise<
    ReadonlyMap<string, { id: string; parentId: string | null; oneCity: boolean }>
  >;
  // The driver bot tells about the new trip; the id of that message, or null if it was not sent.
  readonly announce: (trip: TripRecord) => Promise<number | null>;
  // A trip was published or changed: channel posts and route subscriptions follow (docs/15, docs/24).
  readonly changed: (tripId: string, event: TripEvent) => Promise<void>;
  readonly newId: () => string;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
