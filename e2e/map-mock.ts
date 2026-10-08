import { existsSync, readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import BORDERS from '../apps/backend/seed/district-borders.json' with { type: 'json' };
import { borderOf, districtAt } from '../apps/backend/src/modules/map/domain/borders';
import { confirmed } from './bookings-mock';

// The map of the pickup point (G22) as the Mini Apps see it: a small piece of Tashkent from the
// real archive, read by parts like the API gives it, and the fonts of its labels.
const FIXTURES = 'e2e/fixtures/map';
const archive = readFileSync(`${FIXTURES}/tashkent.pmtiles`);
// What the map was asked: the texts of the search and the zone each one stayed in (G26).
export type MapState = {
  booked: Record<string, unknown> | null;
  readonly searched: string[];
  readonly zones: string[];
};
export const mapState = (): MapState => ({ booked: null, searched: [], zones: [] });
// Places of the search by name (G23) as the index has them: real names inside the piece of the map,
// and the home of the passenger in Samarqand (G24).
export const FOUND = [
  {
    name: 'Mustaqillik maydoni',
    kind: 'transport',
    area: 'Yakkasaroy',
    district: '1726287',
    point: { lat: 41.31495, lng: 69.27107 },
  },
  {
    name: 'Registon maydoni',
    kind: 'place',
    area: 'Samarqand shahri',
    district: '1718401',
    point: { lat: 39.6547, lng: 66.9758 },
  },
];
const DISTRICTS = Object.entries(BORDERS.places as Record<string, string[][]>).map(([id, lines]) =>
  borderOf(id, lines),
);
// The district by the real borders; the name: Registon in Samarqand, Qatortol in Tashkent.
const whereOf = (lat: number, lng: number) => ({
  district: districtAt(DISTRICTS, { lat, lng }),
  name: lat < 40.5 ? { step: 'landmark', name: 'Registon maydoni' } : { step: 'mahalla', name: 'Qatortol' },
  area: null,
});
const person = (id: string, firstName: string) => ({ id: id.padStart(32, '0'), firstName, hasAvatar: false });
const at = (lat: number, lng: number, name: string) => ({
  point: { lat, lng },
  name: { step: 'mahalla', name },
  area: { step: 'mahalla', name },
});
// The bookings of the driver's trip (G24): two confirmed passengers with their points, one request
// near the way, one far and asked first, and a cancelled booking whose points are erased.
const DRIVER_BOOKINGS = [
  {
    ...confirmed,
    id: 'b-near',
    status: 'requested',
    plate: null,
    extraKm: 3,
    passenger: person('1a', 'Aziza'),
  },
  {
    ...confirmed,
    id: 'b-far',
    status: 'requested',
    plate: null,
    extraKm: 24,
    createdAt: confirmed.createdAt - 60_000,
    passenger: person('1b', 'Bobur'),
  },
  { ...confirmed, id: 'b-1', passenger: person('1c', 'Madina'), pickup: at(41.2856, 69.2034, 'Qatortol') },
  {
    ...confirmed,
    id: 'b-2',
    passenger: person('1d', 'Kamola'),
    pickup: at(41.3265, 69.2355, 'Chorsu'),
    dropoff: at(39.66, 66.96, 'Registon mahallasi'),
  },
  {
    ...confirmed,
    id: 'b-gone',
    status: 'cancelled_by_passenger',
    passenger: person('1e', 'Sardor'),
    pickup: null,
    dropoff: null,
  },
];

function part(route: Route) {
  const [, from, to] = /bytes=(\d+)-(\d+)/u.exec(route.request().headers().range ?? '') ?? [];
  if (from === undefined || to === undefined) return route.fulfill({ status: 416 });
  const body = archive.subarray(Number(from), Math.min(archive.length, Number(to) + 1));
  return route.fulfill({
    status: 206,
    body,
    headers: {
      'content-type': 'application/octet-stream',
      'content-range': `bytes ${from}-${Number(from) + body.length - 1}/${archive.length}`,
      etag: '"tashkent"',
    },
  });
}

export async function mockMap(page: Page, state: MapState) {
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  await page.route('**/api/map/*.pmtiles', part);
  await page.route('**/api/map/fonts/*/*', (route) => {
    const [stack = '', file = ''] = new URL(route.request().url()).pathname.split('/').slice(-2);
    const path = `${FIXTURES}/fonts/${decodeURIComponent(stack)}/${file}`;
    return existsSync(path) ? route.fulfill({ body: readFileSync(path) }) : route.fulfill({ status: 404 });
  });
  await page.route('**/api/passenger/map/search?*', (route) => {
    const asked = new URL(route.request().url()).searchParams;
    const query = asked.get('q') ?? '';
    const zone = asked.get('zone') ?? '';
    state.searched.push(query);
    state.zones.push(zone);
    const inZone = (place: (typeof FOUND)[number]) => place.district.startsWith(zone);
    return json(route, {
      places: FOUND.filter(
        (place) => /Регистон/u.test(query) === place.name.startsWith('Reg') && inZone(place),
      ),
    });
  });
  await page.route('**/api/passenger/map/where?*', (route) => {
    const [lat = 0, lng = 0] = (new URL(route.request().url()).searchParams.get('at') ?? '')
      .split(',')
      .map(Number);
    return json(route, whereOf(lat, lng));
  });
  // The real borders of the repository (G24, docs/48): the map of a point is cut by its district;
  // a region (Toshkent shahri, G26) is all its districts, as the backend gives it.
  await page.route('**/api/passenger/map/borders/*', (route) => {
    const id = new URL(route.request().url()).pathname.split('/').at(-1) ?? '';
    const parts = DISTRICTS.filter((each) => each.id.startsWith(id)).flatMap((each) => each.parts);
    return parts.length > 0 ? json(route, { id, parts }) : json(route, {}, 404);
  });
  await page.route('**/api/trips/*/bookings', (route) => {
    state.booked = route.request().postDataJSON() as Record<string, unknown>;
    return json(route, { ...confirmed, status: 'requested', plate: null }, 201);
  });
  await page.route('**/api/driver/bookings', (route) => json(route, { bookings: DRIVER_BOOKINGS }));
}
