import { DAY_MS, tashkentDate, tashkentDayStart, type DirectionCard } from '@platform/contracts';
import { regionIn } from '../../../shared/places/place-match';
import { regionOrder } from '../../../shared/places/region-order';
import { isOpen, type RequestRecord } from '../domain/ride-request';
import type { RequestsDeps } from './ports';

// «Qayerga» of a driver (owner decision 12.11.2026, docs/118): the demand, not the trips. The open
// requests of today and tomorrow from the region of «Qayerdan», by the region they go to, in the
// one order of «Qayerga». One read, as the board (docs/117); never the driver's own, nobody hidden
// by complaints (docs/17).
export async function requestDirections(
  deps: RequestsDeps,
  viewer: number,
  from: string,
): Promise<DirectionCard[]> {
  const now = deps.now();
  const today = tashkentDate(now);
  const tomorrow = tashkentDate(tashkentDayStart(today) + DAY_MS);
  const places = await deps.places();
  const regionOf = regionIn(places);
  const home = regionOf(from);
  const open = (await deps.requests.openFrom(today)).filter(
    (request) =>
      isOpen(request, now) &&
      request.passengerId !== viewer &&
      (request.date === today || request.date === tomorrow) &&
      regionOf(request.from) === home,
  );
  const hidden = await deps.hidden([...new Set(open.map((request) => request.passengerId))]);
  const byRegion = new Map<string, RequestRecord[]>();
  for (const request of open.filter((item) => !hidden.has(item.passengerId))) {
    const region = regionOf(request.to);
    byRegion.set(region, [...(byRegion.get(region) ?? []), request]);
  }
  const activity = new Map([...byRegion].map(([region, requests]) => [region, requests.length]));
  return regionOrder(activity, home, places).map((to) => {
    const requests = byRegion.get(to) ?? [];
    const count = (date: string) => requests.filter((request) => request.date === date).length;
    return { to, today: count(today), tomorrow: count(tomorrow) };
  });
}
