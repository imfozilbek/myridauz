import { checkRoute, type Distance, type DistanceHistory, type RouteError } from '@platform/contracts';
import { namer } from '../../../shared/team/who';
import { indexById, type Directory } from './directory';
import type { LocationsDeps, Result } from './ports';

type DistanceError = RouteError | 'locations.not_found';
type Caller = { readonly id: number; readonly isOwner: boolean };

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

// Only the owner corrects a distance: it moves every price (docs/16, docs/65 A6). The history keeps
// who, when, before and after (G45).
export async function updateDistance(
  deps: LocationsDeps,
  directory: Directory,
  caller: Caller,
  input: Distance,
): Promise<Result<Distance, DistanceError | 'auth.not_owner'>> {
  if (!caller.isOwner) return { ok: false, error: 'auth.not_owner' };
  const error = await checkPair(deps, directory, input.from, input.to);
  if (error) return { ok: false, error };
  const change = { after: input.km, by: caller.id, at: deps.now() };
  await deps.locations.correctDistance(...ordered(input.from, input.to), change);
  return { ok: true, value: input };
}

// The corrections of one distance for the team, by the name of who made each (G45).
export async function distanceHistory(
  deps: LocationsDeps,
  from: string,
  to: string,
): Promise<DistanceHistory> {
  const changes = await deps.locations.distanceChanges(...ordered(from, to));
  const nameOf = await namer(
    deps.names,
    changes.map((change) => change.by),
  );
  return { changes: changes.map((change) => ({ ...change, by: nameOf(change.by) })) };
}
