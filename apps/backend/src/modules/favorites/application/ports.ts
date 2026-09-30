import type { FavoriteDriver, Trip } from '@platform/contracts';

// "Sevimli haydovchilar" (docs/18): D1 in production, memory in tests.
export type FavoriteStore = {
  add(passengerId: number, driverId: number, at: number): Promise<void>;
  remove(passengerId: number, driverId: number): Promise<boolean>;
  // The saved drivers of a passenger, the newest first.
  driversOf(passengerId: number): Promise<number[]>;
  // The passengers who saved a driver: they hear about the driver's new trip.
  fansOf(driverId: number): Promise<number[]>;
  // A deleted account: every saved pair with this person goes (docs/30).
  forget(userId: number): Promise<void>;
};

export type FavoritesDeps = {
  readonly store: FavoriteStore;
  // An approved driver as passengers see one; undefined for anybody else.
  readonly driver: (id: number) => Promise<FavoriteDriver | undefined>;
  // Trips of these drivers that still take passengers, the earliest first.
  readonly upcoming: (driverIds: readonly number[]) => Promise<Trip[]>;
  // The passenger bot tells about a new trip of a saved driver.
  readonly tell: (passengerIds: readonly number[], trip: Trip) => Promise<void>;
  // The Telegram ID behind a public id from a path or a view (docs/65 A3).
  readonly idOf: (publicId: string) => Promise<number | undefined>;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
