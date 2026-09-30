import { existsSync, readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import { confirmed } from './bookings-mock';

// The map of the pickup point (G22) as the Mini Apps see it: a small piece of Tashkent from the
// real archive, read by parts like the API gives it, and the fonts of its labels.
const FIXTURES = 'e2e/fixtures/map';
const archive = readFileSync(`${FIXTURES}/tashkent.pmtiles`);
// Amir Temur square: inside the piece of the map the tests carry.
const CENTER = { lat: 41.3111, lng: 69.2797 };
export type MapState = { pickup: { lat: number; lng: number } | null; readonly saved: unknown[] };
export const mapState = (): MapState => ({ pickup: null, saved: [] });

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
  const json = (route: Route, body: unknown) => route.fulfill({ json: body });
  const mine = () => ({ ...confirmed, meetingPoint: CENTER, pickup: state.pickup });
  await page.route('**/api/map/*.pmtiles', part);
  await page.route('**/api/map/fonts/*/*', (route) => {
    const [stack = '', file = ''] = new URL(route.request().url()).pathname.split('/').slice(-2);
    const path = `${FIXTURES}/fonts/${decodeURIComponent(stack)}/${file}`;
    return existsSync(path) ? route.fulfill({ body: readFileSync(path) }) : route.fulfill({ status: 404 });
  });
  await page.route('**/api/passenger/bookings', (route) => json(route, { bookings: [mine()] }));
  await page.route('**/api/passenger/bookings/*/pickup', (route) => {
    state.pickup = route.request().postDataJSON() as MapState['pickup'];
    state.saved.push(state.pickup);
    return json(route, mine());
  });
  await page.route('**/api/driver/bookings', (route) => json(route, { bookings: [mine()] }));
}
