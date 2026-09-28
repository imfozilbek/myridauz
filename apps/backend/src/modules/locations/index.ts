import type { MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { cachedDirectory } from './application/directory';
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

export const locationsModule = (auth: MiddlewareHandler<AppEnv>) =>
  locationRoutes({ deps: locationsDeps, directory: cachedDirectory(DIRECTORY_TTL_MS), auth });
