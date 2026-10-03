import type { MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { cachedDirectory, indexById } from './application/directory';
import { getDistance } from './application/distance';
import type { LocationsDeps } from './application/ports';
import { locationRoutes } from './http/location-routes';
import { d1Locations } from './infrastructure/d1-locations';
import { createMemoryLocations } from './infrastructure/memory-locations';

// Ten minutes: a changed directory reaches every Worker instance soon, D1 is read rarely.
const DIRECTORY_TTL_MS = 10 * 60 * 1000;

// Without D1 (tests) the directory is empty until a test fills it.
export const localLocations = createMemoryLocations();

const locationsDeps = (env: Bindings): LocationsDeps => ({
  locations: env.DB ? d1Locations(env.DB) : localLocations,
  now: Date.now,
});

const directory = cachedDirectory(DIRECTORY_TTL_MS);
const LOCALE = 'uz-Latn';

export const locationsModule = (auth: MiddlewareHandler<AppEnv>) =>
  locationRoutes({ deps: locationsDeps, directory, auth });

// For other modules: the places by id, and the road km of a possible trip (docs/14, docs/48).
export const placesOf = async (env: Bindings) =>
  indexById((await directory(locationsDeps(env), LOCALE)).locations);
export const routeKm = (env: Bindings, from: string, to: string) =>
  getDistance(locationsDeps(env), directory, from, to);
// The road km between any two places of the driver's trips (docs/103): 0 for the same place, and 0
// when the directory has no distance (two places of one city).
export const roadKmBetween = async (env: Bindings, from: string, to: string) => {
  if (from === to) return 0;
  const [a, b] = from < to ? [from, to] : [to, from];
  return (await locationsDeps(env).locations.distance(a, b)) ?? 0;
};
