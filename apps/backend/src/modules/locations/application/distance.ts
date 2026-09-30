import { checkRoute, type Distance, type RouteError } from '@platform/contracts';
import { indexById, type Directory } from './directory';
import type { LocationsDeps, Result } from './ports';

type DistanceError = RouteError | 'locations.not_found';
type Caller = { readonly isOwner: boolean };

const DEFAULT_LOCALE = 'uz-Latn';
const LEVEL_2 = new Set(['district', 'city']);

// Distances exist only between level 2 places of a possible trip (docs/14).
async function checkPair(
  deps: LocationsDeps,
  directory: Directory,
  from: string,
  to: string,
): Promise<DistanceError | null> {
  const places = indexById((await directory(deps, DEFAULT_LOCALE)).locations);
  const a = places.get(from);
  const b = places.get(to);
  if (!a || !b || !LEVEL_2.has(a.type) || !LEVEL_2.has(b.type)) return 'locations.not_found';
  return checkRoute(a, b, (id) => places.get(id));
}

const ordered = (from: string, to: string): [string, string] => (from < to ? [from, to] : [to, from]);

export async function getDistance(
  deps: LocationsDeps,
  directory: Directory,
  from: string,
  to: string,
): Promise<Result<Distance, DistanceError>> {
  const error = await checkPair(deps, directory, from, to);
  if (error) return { ok: false, error };
  const km = await deps.locations.distance(...ordered(from, to));
  return km === undefined
    ? { ok: false, error: 'locations.not_found' }
    : { ok: true, value: { from, to, km } };
}

// Only the owner corrects a distance: it moves every price (docs/16, docs/65 A6).
export async function updateDistance(
  deps: LocationsDeps,
  directory: Directory,
  caller: Caller,
  input: Distance,
): Promise<Result<Distance, DistanceError | 'auth.not_owner'>> {
  if (!caller.isOwner) return { ok: false, error: 'auth.not_owner' };
  const error = await checkPair(deps, directory, input.from, input.to);
  if (error) return { ok: false, error };
  await deps.locations.saveDistance(...ordered(input.from, input.to), input.km, deps.now());
  return { ok: true, value: input };
}
