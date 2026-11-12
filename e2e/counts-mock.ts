import type { Page, Route } from '@playwright/test';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { toCyrillic } from '@platform/i18n';
import locations from '../apps/backend/seed/locations.json' with { type: 'json' };
import { regionOrder } from '../apps/backend/src/shared/places/region-order';

const CHILONZOR = '1726294';
const KM = 300;
const PLACES = new Map(locations.map((place) => [place.id, place]));
// The requests of passengers of today and tomorrow by the region they go to (owner, 12.11.2026).
const DEMAND = new Map([
  ['1718', { today: 1, tomorrow: 2 }],
  ['1730', { today: 0, tomorrow: 1 }],
]);

// How many trips go where (G59): the cards of «Qayerga borasiz?», the days of «Safarlar» and
// «Yaqin joylar» around the pin.
export async function mockCounts(page: Page, found: readonly { departAt: number }[]) {
  const json = (route: Route, body: unknown) => route.fulfill({ status: 200, json: body });
  const day = (index: number) => tashkentDate(Date.now() + index * DAY_MS);
  const days = Array.from({ length: 7 }, (_, index) => ({
    date: day(index),
    trips: found.filter((trip) => tashkentDate(trip.departAt) === day(index)).length,
  }));
  await page.route('**/api/trips/days?*', (route) => json(route, { km: KM, days, places: [] }));
  await page.route('**/api/trips/directions?*', (route) =>
    json(route, {
      directions: [
        { to: '1718', today: days[0]?.trips ?? 0, tomorrow: days[1]?.trips ?? 0 },
        { to: '1730', today: 2, tomorrow: 5 },
        { to: '1706', today: 1, tomorrow: 4 },
        { to: '1703', today: 0, tomorrow: 3 },
      ],
    }),
  );
  // «Qayerga» of a driver: the regions in the order of the server, never the own one (docs/118).
  await page.route('**/api/driver/requests/directions?*', (route) => {
    const from = new URL(route.request().url()).searchParams.get('from') ?? '';
    const home = PLACES.get(from)?.parentId ?? from;
    const activity = new Map([...DEMAND].map(([to, count]) => [to, count.today + count.tomorrow]));
    const card = (to: string) => ({ to, today: 0, tomorrow: 0, ...DEMAND.get(to) });
    return json(route, { directions: regionOrder(activity, home, PLACES).map(card) });
  });
  // The names as the API gives them: in Cyrillic (G98).
  const near = (name: string, kind: string, lat: number) => ({
    name: toCyrillic(name),
    kind,
    area: toCyrillic('Chilonzor'),
    district: CHILONZOR,
    point: { lat, lng: 69.204 },
  });
  await page.route('**/api/passenger/map/near?*', (route) =>
    json(route, {
      places: [
        near('Chilonzor metrosi', 'transport', 41.2856),
        near('Grand', 'market', 41.2861),
        near('Korzinka', 'market', 41.2849),
      ],
    }),
  );
}
