import type { Trip } from '@platform/contracts';
import { lowerPrice, priceNoticeDue, retime, type ChangeError } from '../domain/trip-change';
import type { TripRecord } from '../domain/trip';
import type { Result, TripEvent, TripsDeps } from './ports';
import { movedBusy } from './schedule';
import { views } from './views-of';

type Changed = Promise<Result<Trip, ChangeError | 'trips.busy' | 'trips.price_out_of_bounds'>>;

async function saved(deps: TripsDeps, next: TripRecord, event: TripEvent): Changed {
  await deps.trips.save(next);
  await deps.changed(next.id, event);
  const [view] = await views(deps, [next]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}

// The driver moves the time later (docs/104, 8): the trips around it still fit (docs/103), the
// people with a booking are told.
export async function retimeTrip(deps: TripsDeps, driverId: number, id: string, departAt: number): Changed {
  const trip = await deps.trips.find(id);
  if (!trip) return { ok: false, error: 'trips.not_found' };
  const next = retime(trip, driverId, departAt, deps.now());
  if (typeof next === 'string') return { ok: false, error: next };
  if (await movedBusy(deps, next)) return { ok: false, error: 'trips.busy' };
  return saved(deps, next, 'retimed');
}

// The driver lowers the price (docs/104, 9): not below the bound of the route. Subscribers and the
// people with a booking hear of it once a day; the channel post shows the new price at once.
export async function lowerTripPrice(deps: TripsDeps, driverId: number, id: string, price: number): Changed {
  const trip = await deps.trips.find(id);
  if (!trip) return { ok: false, error: 'trips.not_found' };
  const bounds = await deps.recommend(trip.from, trip.to);
  if (!bounds.ok) return { ok: false, error: 'trips.price_out_of_bounds' };
  const now = deps.now();
  const next = lowerPrice(trip, driverId, price, bounds.value.minPrice, now);
  if (typeof next === 'string') return { ok: false, error: next };
  const due = priceNoticeDue(trip, now);
  return saved(deps, due ? { ...next, priceToldAt: now } : next, due ? 'cheaper' : 'updated');
}
