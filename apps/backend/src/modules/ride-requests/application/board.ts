import {
  DAY_MS,
  tashkentDate,
  tashkentDayStart,
  type RequestBoard,
  type RequestBoardQuery,
} from '@platform/contracts';
import { placeMatches, regionIn } from '../../../shared/places/place-match';
import { boardDays, tripFit } from '../domain/board-fit';
import { isOpen, type RequestRecord } from '../domain/ride-request';
import type { RequestsDeps, Result } from './ports';
import { views } from './views';

const nextDay = (date: string) => tashkentDate(tashkentDayStart(date) + DAY_MS);

// «Yoʻlovchilar soʻrovlari» (G64, docs/118 path 7): open requests on the directions of the driver (the
// regions of the driver's trips and subscriptions, both ways) or on the route of a bot link; only what
// the car can take, never the driver's own, nobody hidden by complaints (docs/17). With a live trip
// of the driver: the requests of its day, the ones that fit it first with their extra km.
export async function requestBoard(
  deps: RequestsDeps,
  driverId: number,
  query: RequestBoardQuery,
): Promise<Result<RequestBoard, 'trips.not_driver'>> {
  const car = await deps.approvedCar(driverId);
  if (!car) return { ok: false, error: 'trips.not_driver' };
  const now = deps.now();
  const today = tashkentDate(now);
  const places = await deps.places();
  const regionOf = regionIn(places);
  const { from, to } = query;
  const route = from && to ? { from, to } : null;
  const directions = route ? [] : await deps.board.directions(driverId);
  const date = query.date ?? today;
  if (!route && directions.length === 0)
    return { ok: true, value: { known: false, date, days: [], trip: null, fits: [], others: [] } };
  const onDirection = (request: RequestRecord) =>
    route
      ? placeMatches(request.from, route.from, places) && placeMatches(request.to, route.to, places)
      : directions.some(
          (way) => regionOf(way.from) === regionOf(request.from) && regionOf(way.to) === regionOf(request.to),
        );
  const open = (await deps.requests.openFrom(today)).filter(
    (request) =>
      isOpen(request, now) &&
      request.passengerId !== driverId &&
      request.seats <= car.seats &&
      onDirection(request),
  );
  const hidden = await deps.hidden([...new Set(open.map((request) => request.passengerId))]);
  const shown = open.filter((request) => !hidden.has(request.passengerId));
  const days = boardDays(
    shown.map((request) => request.date),
    today,
    nextDay,
  );
  const nearest = route ? null : await deps.board.trip(driverId);
  const day = nearest ? tashkentDate(nearest.trip.departAt) : date;
  const ofDay = shown.filter((request) => request.date === day);
  if (!nearest)
    return {
      ok: true,
      value: { known: true, date: day, days, trip: null, fits: [], others: await views(deps, ofDay) },
    };
  const measured = ofDay.map((request) => ({
    request,
    extra: tripFit(nearest.trip, nearest.stops, request, regionOf),
  }));
  const fitting = measured
    .filter((item) => item.extra !== null)
    .sort((a, b) => (a.extra ?? 0) - (b.extra ?? 0));
  const extraOf = new Map(fitting.map((item) => [item.request.id, item.extra ?? 0]));
  const fitViews = await views(
    deps,
    fitting.map((item) => item.request),
  );
  const fits = fitViews.map((view) => ({ ...view, extraKm: extraOf.get(view.id) ?? 0 }));
  const others = await views(
    deps,
    measured.filter((item) => item.extra === null).map((item) => item.request),
  );
  return { ok: true, value: { known: true, date: day, days, trip: nearest.trip, fits, others } };
}
