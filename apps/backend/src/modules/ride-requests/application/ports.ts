import type { Car, Recommendation, RouteError } from '@platform/contracts';
import type { Person } from '../../users';
import type { RequestRecord } from '../domain/ride-request';

// Ports of the ride requests module: D1 in production, memory in tests.
export type RequestRepository = {
  save(request: RequestRecord): Promise<void>;
  find(id: string): Promise<RequestRecord | undefined>;
  byPassenger(passengerId: number): Promise<RequestRecord[]>;
  // Open requests of one day in Tashkent, the oldest first.
  openOn(date: string): Promise<RequestRecord[]>;
  // The Cron job: requests of a day that is over become expired (docs/35).
  expireOver(now: number): Promise<void>;
};

export type RequestsDeps = {
  readonly requests: RequestRepository;
  readonly people: { find(id: number): Promise<Person | undefined> };
  readonly approvedCar: (driverId: number) => Promise<Car | null>;
  readonly recommend: (
    from: string,
    to: string,
  ) => Promise<Result<Recommendation, RouteError | 'locations.not_found'>>;
  readonly places: () => Promise<
    ReadonlyMap<string, { id: string; parentId: string | null; oneCity: boolean }>
  >;
  // A request was published: drivers subscribed to its route hear about it (docs/24).
  readonly published: (requestId: string) => Promise<void>;
  readonly newId: () => string;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
