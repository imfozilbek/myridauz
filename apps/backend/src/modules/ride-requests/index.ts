import type { Bindings } from '../../env';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import { pointFitsPlace } from '../map';
import { pitakOf } from '../pitaks';
import { ratingsOfPeople } from '../ratings';
import type { RequestsDeps } from './application/ports';
import { cancelRequest } from './application/use-cases';
import { views } from './application/views';
import { requestRoutes } from './http/request-routes';
import { d1Requests } from './infrastructure/d1-requests';
import { createMemoryRequests } from './infrastructure/memory-requests';
import { isOpen, withoutPoints, type RequestRecord } from './domain/ride-request';

// Without D1 (tests) requests live in memory.
const localRequests = createMemoryRequests();

// Drivers subscribed to a route hear about a new request (docs/24): set by the app (module-events.ts).
type Published = (env: Bindings, requestId: string) => Promise<void>;
let onPublished: Published = async () => undefined;
export const handleRequestPublished = (handler: Published) => void (onPublished = handler);
// People hidden by complaints (docs/17): set by the app, the complaints module knows them.
type Hidden = (env: Bindings, userIds: readonly number[]) => Promise<ReadonlySet<number>>;
let hiddenOf: Hidden = async () => new Set();
export const wireHiddenRequesters = (hidden: Hidden) => void (hiddenOf = hidden);

// The board of a driver (G64): the directions and the nearest trip, from the trips, the subscriptions
// and the bookings, set by the app (module-events.ts).
type Board = {
  readonly directions: (env: Bindings, driverId: number) => ReturnType<RequestsDeps['board']['directions']>;
  readonly trip: (env: Bindings, driverId: number) => ReturnType<RequestsDeps['board']['trip']>;
};
let boardOf: Board = { directions: async () => [], trip: async () => null };
export const wireRequestBoard = (board: Board) => void (boardOf = board);

const requestsDeps = (env: Bindings): RequestsDeps => ({
  requests: env.DB ? d1Requests(env.DB) : localRequests,
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  recommend: (from, to) => recommendationFor(env, from, to),
  places: () => placesOf(env),
  pitakOf: (from, to) => pitakOf(env, from, to),
  fits: pointFitsPlace,
  published: (requestId) => onPublished(env, requestId),
  hidden: (userIds) => hiddenOf(env, userIds),
  board: {
    directions: (driverId) => boardOf.directions(env, driverId),
    trip: (driverId) => boardOf.trip(env, driverId),
  },
  ratings: (userIds) => ratingsOfPeople(env, userIds),
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
  price: request.price,
  wholeCar: request.wholeCar,
  withWoman: request.withWoman,
  pickupMode: request.pickupMode,
  pickup: request.pickup,
  dropoff: request.dropoff,
  open: isOpen(request, now),
  callsOff: request.callsOff,
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
  // The booking of the accepted offer took the points over (docs/69).
  if (request) await requests.save(withoutPoints({ ...request, status: 'matched' }));
};

// "Maʼlumotlarimni oʻchirish" (docs/30): the points of the person's requests go at once.
export const eraseRequestPointsOf = (env: Bindings, passengerId: number) =>
  requestsDeps(env).requests.erasePointsOf(passengerId);

// A request as drivers see it: for route subscriptions (docs/24).
export const requestViewOf = async (env: Bindings, id: string) => {
  const deps = requestsDeps(env);
  const request = await deps.requests.find(id);
  return request ? (await views(deps, [request]))[0] : undefined;
};

// A blocked or deleted passenger: the open request ends (docs/65 A5).
export const cancelRequestOf = (env: Bindings, passengerId: number, id: string) =>
  cancelRequest(requestsDeps(env), passengerId, id);
