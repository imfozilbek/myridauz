import type { Page, Route } from '@playwright/test';
import MAIN_DIRECTIONS from '../apps/backend/seed/main-directions.json' with { type: 'json' };

// Trips, requests and prices as the Mini Apps see them (G07). Toshkent → Samarqand: ≈ 300 km (docs/16).
const CHILONZOR = '1726294';
const SAMARQAND = '1718401';
const KM = 300;
const V = { ratePerKm: 300, roundStep: 5000, minPrice: 30000, maxPrice: 600000 };
const perKm = (km: number, v = V) =>
  Math.min(v.maxPrice, Math.max(v.minPrice, Math.round((km * v.ratePerKm) / v.roundStep) * v.roundStep));
// km of the main directions of docs/16, in the order of seed/main-directions.json.
const MAIN_KM = [35, 120, 200, 290, 300, 320, 350, 465, 490, 570, 700, 1000, 1150, 420];
// The main pitak of Toshkent → Samarqand (docs/73).
export const PITAK = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 } };
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white' };
const inHours = (hours: number) => Math.ceil((Date.now() + hours * 3_600_000) / 1_800_000) * 1_800_000;
export const tripOf = (id: string, name: string, woman: boolean, hours: number, extra: object = {}) => ({
  id: `00000000-0000-4000-8000-00000000000${id}`,
  driver: {
    id: (Number(id) + 10).toString(16).padStart(32, '0'),
    firstName: name,
    hasAvatar: false,
    car,
    rating: { average: 4.9, count: 23 },
  },
  from: CHILONZOR,
  to: SAMARQAND,
  departAt: inHours(hours),
  km: KM,
  seats: 3,
  seatsLeft: 3,
  price: 90000,
  recommendedPrice: 90000,
  woman,
  pickupMode: 'both',
  pitak: PITAK,
  comment: '',
  status: 'active',
  ...extra,
});
export const request = {
  id: '00000000-0000-4000-8000-0000000000a1',
  passenger: { id: '0000000000000000000000000000001f', firstName: 'Madina', hasAvatar: false },
  from: CHILONZOR,
  to: SAMARQAND,
  date: new Date(Date.now() + 5 * 3_600_000 + 86_400_000).toISOString().slice(0, 10),
  km: KM,
  seats: 2,
  price: 90000,
  pickupMode: 'door',
  status: 'open',
};

export async function mockMarket(page: Page) {
  const published: object[] = [];
  const found = [
    tripOf('1', 'Jasur', false, 26),
    tripOf('2', 'Nodira', true, 29, { comment: 'Katta yuk olmayman', price: 100000 }),
  ];
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  await page.route('**/api/prices/recommendation?*', (route) =>
    json(route, { from: CHILONZOR, to: SAMARQAND, km: KM, price: perKm(KM), source: 'formula', ...V }),
  );
  // G24: the pitak of the direction, the district of a point, no borders (the map is not cut).
  await page.route('**/api/pitaks/direction?*', (route) => json(route, { pitak: PITAK }));
  await page.route('**/api/passenger/map/where?*', (route) =>
    json(route, { district: CHILONZOR, name: { step: 'mahalla', name: 'Qatortol' }, area: null }),
  );
  await page.route('**/api/passenger/map/borders/*', (route) => json(route, {}, 404));
  await page.route('**/api/trips?*', (route) => {
    const woman = new URL(route.request().url()).searchParams.get('woman') === '1';
    return json(route, { trips: woman ? found.filter((trip) => trip.woman) : found });
  });
  await page.route('**/api/driver/trips', (route) => {
    if (route.request().method() === 'GET') return json(route, { trips: published });
    const input = route.request().postDataJSON() as Record<string, unknown>;
    const trip = { ...tripOf('9', 'Dilnoza', false, 0), ...input, woman: true };
    published.push(trip);
    return json(route, trip, 201);
  });
  await page.route('**/api/admin/trips', (route) =>
    json(route, { trips: [...found, { ...tripOf('3', 'Bekzod', false, 20), status: 'cancelled' }] }),
  );
  await page.route('**/api/driver/requests?*', (route) => json(route, { requests: [request] }));
  await page.route('**/api/passenger/requests', (route) =>
    route.request().method() === 'GET'
      ? json(route, { requests: [request] })
      : json(route, { ...request, ...(route.request().postDataJSON() as object) }, 201),
  );
  let variables = V;
  const state = () => ({
    current: { version: 2, variables, changedBy: 1, changedAt: Date.now() },
    history: [
      { version: 2, variables, changedBy: 1, changedAt: Date.now() },
      { version: 1, variables: V, changedBy: null, changedAt: 0 },
    ],
  });
  const rows = MAIN_DIRECTIONS.map(([from = '', to = ''], index) => ({ from, to, km: MAIN_KM[index] ?? KM }));
  await page.route('**/api/admin/pricing', (route) => {
    if (route.request().method() === 'POST') variables = route.request().postDataJSON() as typeof V;
    return json(route, state());
  });
  await page.route('**/api/admin/pricing/preview', (route) => {
    const next = route.request().postDataJSON() as typeof V;
    return json(route, {
      rows: rows.map((row) => ({ ...row, before: perKm(row.km, variables), after: perKm(row.km, next) })),
    });
  });
  await page.route('**/api/admin/pricing/directions', (route) =>
    json(route, {
      // The first direction has enough real trips for the median hint (G18, docs/09).
      directions: rows.map((row, index) => ({
        ...row,
        formula: perKm(row.km, variables),
        manual: null,
        median: index === 0 ? perKm(row.km, variables) + 5000 : null,
        medianTrips: index === 0 ? 14 : 3,
      })),
    }),
  );
  return { published };
}
