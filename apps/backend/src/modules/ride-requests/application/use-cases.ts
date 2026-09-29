import {
  MAX_OPEN_REQUESTS,
  type RequestSearch,
  type RideRequest,
  type RideRequestInput,
} from '@platform/contracts';
import { placeMatches } from '../../../shared/places/place-match';
import { cancel, dateError, expiresAt, isOpen, statusAt, type RequestRecord } from '../domain/ride-request';
import type { RequestsDeps, Result } from './ports';

type PublishError =
  | 'trips.invalid_input'
  | 'trips.in_past'
  | 'trips.price_out_of_bounds'
  | 'trips.too_many'
  | 'locations.not_found'
  | 'locations.same_place'
  | 'locations.inside_city';

// Other people see only the name and the face of the passenger (docs/07).
async function views(deps: RequestsDeps, requests: readonly RequestRecord[]): Promise<RideRequest[]> {
  const now = deps.now();
  const found = await Promise.all(
    requests.map(async (request) => {
      const person = await deps.people.find(request.passengerId);
      if (!person) return null;
      const passenger = { id: person.id, firstName: person.firstName, hasAvatar: person.avatarKey !== null };
      const { id, from, to, date, km, seats, price } = request;
      return { id, passenger, from, to, date, km, seats, price, status: statusAt(request, now) };
    }),
  );
  return found.filter((request) => request !== null);
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
  const request: RequestRecord = {
    ...input,
    id: deps.newId(),
    passengerId,
    expiresAt: expiresAt(input.date),
    km,
    status: 'open',
    createdAt: now,
  };
  await deps.requests.save(request);
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
  const requests = await deps.requests.byPassenger(passengerId);
  return views(
    deps,
    [...requests].sort((a, b) => b.createdAt - a.createdAt),
  );
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
