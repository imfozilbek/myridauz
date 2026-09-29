import type { Bindings } from '../../env';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import type { RequestsDeps } from './application/ports';
import { views } from './application/use-cases';
import { requestRoutes } from './http/request-routes';
import { d1Requests } from './infrastructure/d1-requests';
import { createMemoryRequests } from './infrastructure/memory-requests';
import { isOpen, type RequestRecord } from './domain/ride-request';

// Without D1 (tests) requests live in memory.
const localRequests = createMemoryRequests();

// Drivers subscribed to a route hear about a new request (docs/24): set by the app (module-events.ts).
type Published = (env: Bindings, requestId: string) => Promise<void>;
let onPublished: Published = async () => undefined;
export const handleRequestPublished = (handler: Published) => void (onPublished = handler);

const requestsDeps = (env: Bindings): RequestsDeps => ({
  requests: env.DB ? d1Requests(env.DB) : localRequests,
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  recommend: (from, to) => recommendationFor(env, from, to),
  places: () => placesOf(env),
  published: (requestId) => onPublished(env, requestId),
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const requestsModule = requestRoutes(requestsDeps);

// The Cron job (docs/35): requests of a day that is over become expired.
export const expireRequests = (env: Bindings, now: number) => requestsDeps(env).requests.expireOver(now);

// For offers (G08): the facts of a request and "matched" when a passenger accepts an offer.
const factsOf = (request: RequestRecord, now: number) => ({
  id: request.id,
  passengerId: request.passengerId,
  from: request.from,
  to: request.to,
  date: request.date,
  km: request.km,
  seats: request.seats,
  open: isOpen(request, now),
});
export const requestFacts = async (env: Bindings, id: string) => {
  const request = await requestsDeps(env).requests.find(id);
  return request ? factsOf(request, Date.now()) : undefined;
};
export const passengerRequestFacts = async (env: Bindings, passengerId: number) =>
  (await requestsDeps(env).requests.byPassenger(passengerId)).map((request) => factsOf(request, Date.now()));
export const markMatched = async (env: Bindings, id: string) => {
  const { requests } = requestsDeps(env);
  const request = await requests.find(id);
  if (request) await requests.save({ ...request, status: 'matched' });
};

// A request as drivers see it: for route subscriptions (docs/24).
export const requestViewOf = async (env: Bindings, id: string) => {
  const deps = requestsDeps(env);
  const request = await deps.requests.find(id);
  return request ? (await views(deps, [request]))[0] : undefined;
};
