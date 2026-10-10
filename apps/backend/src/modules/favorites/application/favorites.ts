import type { Favorites, Trip } from '@platform/contracts';
import type { FavoritesDeps, Result } from './ports';

type AddError = 'favorites.not_found' | 'favorites.too_many';

// A passenger saves an approved driver, never oneself (docs/18).
export async function addFavorite(
  deps: FavoritesDeps,
  passengerId: number,
  driverId: number,
): Promise<Result<true, AddError>> {
  if (passengerId === driverId || !(await deps.driver(driverId)))
    return { ok: false, error: 'favorites.not_found' };
  const saved = await deps.store.driversOf(passengerId);
  if (saved.includes(driverId)) return { ok: true, value: true };
  if (saved.length >= deps.max) return { ok: false, error: 'favorites.too_many' };
  await deps.store.add(passengerId, driverId, deps.now());
  return { ok: true, value: true };
}

export const removeFavorite = (deps: FavoritesDeps, passengerId: number, driverId: number) =>
  deps.store.remove(passengerId, driverId);

// The saved drivers and their trips that still take passengers.
export async function favoritesOf(deps: FavoritesDeps, passengerId: number): Promise<Favorites> {
  const ids = await deps.store.driversOf(passengerId);
  const [drivers, trips] = await Promise.all([
    Promise.all(ids.map((id) => deps.driver(id))),
    deps.upcoming(ids),
  ]);
  return { drivers: drivers.filter((driver) => driver !== undefined), trips };
}

// A new trip of a saved driver: every passenger who saved the driver hears about it.
export async function tellFans(deps: FavoritesDeps, trip: Trip): Promise<void> {
  const driverId = await deps.idOf(trip.driver.id);
  const fans = driverId === undefined ? [] : await deps.store.fansOf(driverId);
  if (fans.length > 0) await deps.tell(fans, trip);
}
