import {
  DAY_MS,
  tashkentDayStart,
  type RequestSearch,
  type RideRequest,
  type Point,
  type RideRequestData,
} from '@platform/contracts';
import { placeMatches, regionIn } from '../../../shared/places/place-match';
import {
  cancel,
  dateError,
  expiresAt,
  isOpen,
  keepsWithWoman,
  type RequestRecord,
} from '../domain/ride-request';
import type { RequestsDeps, Result } from './ports';
import { views } from './views';
import { upcomingFirst } from '../../../shared/order/upcoming-first';

type PublishError =
  | 'trips.invalid_input'
  | 'trips.in_past'
  | 'trips.price_out_of_bounds'
  | 'trips.too_many'
  | 'trips.request_exists'
  | 'locations.not_found'
  | 'locations.same_place'
  | 'locations.inside_city'
  | 'bookings.wrong_mode'
  | 'bookings.outside_area';

const plain = ({ lat, lng }: Point) => ({ lat, lng });

// The way of a request (docs/70): «Pitakdan» only where the direction has a pitak; a point at the
// door unless only the pitak suits; the points in the districts of the route (docs/69).
async function wayError(deps: RequestsDeps, input: RideRequestData) {
  const regionOf = regionIn(await deps.places());
  const pitak = await deps.pitakOf(regionOf(input.from), regionOf(input.to));
  if (input.pickupMode === 'pitak' && !pitak) return 'bookings.wrong_mode';
  if (input.pickupMode !== 'pitak' && !input.pickup) return 'bookings.wrong_mode';
  const pickupFits = input.pickupMode === 'pitak' || (input.pickup && deps.fits(input.pickup, input.from));
  return pickupFits && deps.fits(input.dropoff, input.to) ? null : 'bookings.outside_area';
}

export async function publishRequest(
  deps: RequestsDeps,
  passengerId: number,
  input: RideRequestData,
): Promise<Result<RideRequest, PublishError>> {
  const now = deps.now();
  const timeError = dateError(input.date, now, deps.limits.schedule.daysAhead);
  if (timeError) return { ok: false, error: timeError };
  // The seats of one request: the brand's limit, the owner changes it (docs/127 §3).
  if (input.seats > deps.limits.requests.maxSeats) return { ok: false, error: 'trips.invalid_input' };
  const recommendation = await deps.recommend(input.from, input.to);
  if (!recommendation.ok) return recommendation;
  const { km, minPrice, maxPrice } = recommendation.value;
  if (input.price < minPrice || input.price > maxPrice)
    return { ok: false, error: 'trips.price_out_of_bounds' };
  const open = (await deps.requests.byPassenger(passengerId)).filter((request) => isOpen(request, now));
  // One open request on one route and day: drivers see one person once (G37, docs/101 R5).
  const same = open.some(
    (item) => item.from === input.from && item.to === input.to && item.date === input.date,
  );
  if (same) return { ok: false, error: 'trips.request_exists' };
  if (open.length >= deps.limits.requests.maxOpen) return { ok: false, error: 'trips.too_many' };
  const pointsError = await wayError(deps, input);
  if (pointsError) return { ok: false, error: pointsError };
  const passenger = await deps.people.find(passengerId);
  const request: RequestRecord = {
    ...input,
    withWoman: keepsWithWoman(input.withWoman, input.seats, passenger?.gender === 'female'),
    pickup: input.pickupMode === 'pitak' || !input.pickup ? null : plain(input.pickup),
    dropoff: plain(input.dropoff),
    id: deps.newId(),
    passengerId,
    expiresAt: expiresAt(input.date),
    km,
    status: 'open',
    callsOff: false,
    createdAt: now,
  };
  await deps.requests.save(request);
  await deps.published(request.id);
  const [view] = await views(deps, [request]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.invalid_input' };
}

// Drivers look for passengers (docs/09): only an approved driver.
export async function searchRequests(
  deps: RequestsDeps,
  driverId: number,
  search: RequestSearch,
): Promise<Result<RideRequest[], 'trips.not_driver'>> {
  const car = await deps.approvedCar(driverId);
  if (!car) return { ok: false, error: 'trips.not_driver' };
  const now = deps.now();
  const [requests, places] = await Promise.all([deps.requests.openOn(search.date), deps.places()]);
  // Only what the car can take: an offer for more seats is refused anyway (docs/90 F-D2).
  const fits = requests.filter(
    (request) =>
      isOpen(request, now) &&
      request.passengerId !== driverId &&
      request.seats <= car.seats &&
      placeMatches(request.from, search.from, places) &&
      placeMatches(request.to, search.to, places),
  );
  const hidden = await deps.hidden([...new Set(fits.map((request) => request.passengerId))]);
  return {
    ok: true,
    value: await views(
      deps,
      fits.filter((request) => !hidden.has(request.passengerId)),
    ),
  };
}

export async function myRequests(deps: RequestsDeps, passengerId: number): Promise<RideRequest[]> {
  // The requests ahead first, then the past ones; a request lasts until the end of its day (docs/65 B6).
  const endOfDay = (request: RequestRecord) => tashkentDayStart(request.date) + DAY_MS - 1;
  return views(deps, upcomingFirst(await deps.requests.byPassenger(passengerId), endOfDay, deps.now()));
}

export async function cancelRequest(
  deps: RequestsDeps,
  passengerId: number,
  id: string,
): Promise<Result<RideRequest, 'trips.not_found' | 'trips.wrong_status'>> {
  const request = await deps.requests.find(id);
  if (!request) return { ok: false, error: 'trips.not_found' };
  const next = cancel(request, passengerId, deps.now());
  if (typeof next === 'string') return { ok: false, error: next };
  await deps.requests.save(next);
  await deps.changed(id);
  const [view] = await views(deps, [next]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}
