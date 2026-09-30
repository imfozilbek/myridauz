import {
  DAY_MS,
  MAX_OPEN_REQUESTS,
  tashkentDayStart,
  type RequestSearch,
  type RideRequest,
  type Point,
  type RideRequestInput,
} from '@platform/contracts';
import { placeMatches } from '../../../shared/places/place-match';
import { cancel, dateError, expiresAt, isOpen, statusAt, type RequestRecord } from '../domain/ride-request';
import type { RequestsDeps, Result } from './ports';
import { upcomingFirst } from '../../../shared/order/upcoming-first';

type PublishError =
  | 'trips.invalid_input'
  | 'trips.in_past'
  | 'trips.price_out_of_bounds'
  | 'trips.too_many'
  | 'locations.not_found'
  | 'locations.same_place'
  | 'locations.inside_city'
  | 'bookings.wrong_mode'
  | 'bookings.outside_area';

// Other people see only the name and the face of the passenger (docs/07).
export async function views(deps: RequestsDeps, requests: readonly RequestRecord[]): Promise<RideRequest[]> {
  const now = deps.now();
  const found = await Promise.all(
    requests.map(async (request) => {
      const person = await deps.people.find(request.passengerId);
      if (!person) return null;
      const passenger = {
        id: person.publicId,
        firstName: person.firstName,
        hasAvatar: person.avatarKey !== null,
      };
      const { id, from, to, date, km, seats, price, pickupMode } = request;
      return { id, passenger, from, to, date, km, seats, price, pickupMode, status: statusAt(request, now) };
    }),
  );
  return found.filter((request) => request !== null);
}

const plain = ({ lat, lng }: Point) => ({ lat, lng });

// The way of a request (docs/70): «Pitakdan» only where the direction has a pitak; a point at the
// door unless only the pitak suits; the points in the districts of the route (docs/69).
async function wayError(deps: RequestsDeps, input: Required<RideRequestInput>) {
  const places = await deps.places();
  const regionOf = (id: string) => places.get(id)?.parentId ?? id;
  const pitak = await deps.pitakOf(regionOf(input.from), regionOf(input.to));
  if (input.pickupMode === 'pitak' && !pitak) return 'bookings.wrong_mode';
  if (input.pickupMode !== 'pitak' && !input.pickup) return 'bookings.wrong_mode';
  const pickupFits = input.pickupMode === 'pitak' || (input.pickup && deps.fits(input.pickup, input.from));
  return pickupFits && deps.fits(input.dropoff, input.to) ? null : 'bookings.outside_area';
}

export async function publishRequest(
  deps: RequestsDeps,
  passengerId: number,
  input: Required<RideRequestInput>,
): Promise<Result<RideRequest, PublishError>> {
  const now = deps.now();
  const timeError = dateError(input.date, now);
  if (timeError) return { ok: false, error: timeError };
  const recommendation = await deps.recommend(input.from, input.to);
  if (!recommendation.ok) return recommendation;
  const { km, minPrice, maxPrice } = recommendation.value;
  if (input.price < minPrice || input.price > maxPrice)
    return { ok: false, error: 'trips.price_out_of_bounds' };
  const open = (await deps.requests.byPassenger(passengerId)).filter((request) => isOpen(request, now));
  if (open.length >= MAX_OPEN_REQUESTS) return { ok: false, error: 'trips.too_many' };
  const pointsError = await wayError(deps, input);
  if (pointsError) return { ok: false, error: pointsError };
  const request: RequestRecord = {
    ...input,
    pickup: input.pickupMode === 'pitak' || !input.pickup ? null : plain(input.pickup),
    dropoff: plain(input.dropoff),
    id: deps.newId(),
    passengerId,
    expiresAt: expiresAt(input.date),
    km,
    status: 'open',
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
  if (!(await deps.approvedCar(driverId))) return { ok: false, error: 'trips.not_driver' };
  const now = deps.now();
  const [requests, places] = await Promise.all([deps.requests.openOn(search.date), deps.places()]);
  const fits = requests.filter(
    (request) =>
      isOpen(request, now) &&
      request.passengerId !== driverId &&
      placeMatches(request.from, search.from, places) &&
      placeMatches(request.to, search.to, places),
  );
  return { ok: true, value: await views(deps, fits) };
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
  const [view] = await views(deps, [next]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}
