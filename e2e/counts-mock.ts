import type { Page, Route } from '@playwright/test';
import { DAY_MS, tashkentDate } from '@platform/contracts';

const CHILONZOR = '1726294';
const KM = 300;

// How many trips go where (G59): the cards of «Qayerga borasiz?», the days of «Safarlar» and
// «Yaqin joylar» around the pin.
export async function mockCounts(page: Page, found: readonly { departAt: number }[]) {
  const json = (route: Route, body: unknown) => route.fulfill({ status: 200, json: body });
  const day = (index: number) => tashkentDate(Date.now() + index * DAY_MS);
  const days = Array.from({ length: 7 }, (_, index) => ({
    date: day(index),
    trips: found.filter((trip) => tashkentDate(trip.departAt) === day(index)).length,
  }));
  await page.route('**/api/trips/days?*', (route) => json(route, { km: KM, days }));
  await page.route('**/api/trips/directions?*', (route) =>
    json(route, {
      directions: [
        { to: '1718', today: days[0]?.trips ?? 0, tomorrow: days[1]?.trips ?? 0, price: 90000 },
        { to: '1730', today: 2, tomorrow: 5, price: 100000 },
        { to: '1706', today: 1, tomorrow: 4, price: 160000 },
        { to: '1703', today: 0, tomorrow: 3, price: 110000 },
      ],
    }),
  );
  const near = (name: string, kind: string, lat: number) => ({
    name,
    kind,
    area: 'Chilonzor',
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
