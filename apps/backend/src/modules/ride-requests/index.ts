import type { Bindings } from '../../env';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import type { RequestsDeps } from './application/ports';
import { requestRoutes } from './http/request-routes';
import { d1Requests } from './infrastructure/d1-requests';
import { createMemoryRequests } from './infrastructure/memory-requests';

// Without D1 (tests) requests live in memory.
const localRequests = createMemoryRequests();

const requestsDeps = (env: Bindings): RequestsDeps => ({
  requests: env.DB ? d1Requests(env.DB) : localRequests,
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  recommend: (from, to) => recommendationFor(env, from, to),
  places: () => placesOf(env),
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const requestsModule = requestRoutes(requestsDeps);

// The Cron job (docs/35): requests of a day that is over become expired.
export const expireRequests = (env: Bindings, now: number) => requestsDeps(env).requests.expireOver(now);
