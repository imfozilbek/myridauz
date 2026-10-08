import type { Page, Route } from '@playwright/test';

// The own trip of a driver from the publishing to the way back (G63): one passenger asks, the
// driver confirms, leaves, arrives and rates. The server keeps the trip the app published
// (mockMarket) and answers each step; every call the screens make is kept in order.
const HOUR = 3_600_000;
const SEAT = '00000000-0000-4000-8000-0000000000d1';
const PUBLICITY = {
  channels: [{ username: 'yol_samarqand', title: 'Samarqand yoʻli', posted: true }],
  views: 3,
  link: 'https://t.me/test_bot?startapp=trip_1__driver',
};

type Trip = Record<string, unknown>;

export async function mockOwnTrip(page: Page, published: Trip[]) {
  const calls: string[] = [];
  let status: 'none' | 'requested' | 'confirmed' = 'none';
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  const trip = (): Trip => published[0] ?? {};
  const seat = () => ({
    id: SEAT,
    trip: trip(),
    passenger: {
      id: '0000000000000000000000000000002f',
      firstName: 'Madina',
      hasAvatar: false,
      rating: { average: 4.8, count: 12 },
    },
    seats: 2,
    price: trip()['price'],
    commission: (2 * Number(trip()['price'])) / 10,
    status,
    createdAt: Date.now() - HOUR,
    expiresAt: Date.now() + HOUR,
    mode: 'door',
    pitak: null,
    pickup: { point: null, name: null, area: { step: 'mahalla', name: 'Qatortol' } },
    dropoff: { point: null, name: null, area: { step: 'district', name: 'Samarqand shahri' } },
    extraKm: 2,
    plate: null,
    chatKey: `b${SEAT}`,
    confirmedAt: status === 'confirmed' ? Date.now() : null,
    boardedAt: null,
    arrivedAt: null,
  });
  await page.route('**/api/driver/bookings', (route) =>
    json(route, { bookings: status === 'none' ? [] : [seat()] }),
  );
  await page.route('**/api/driver/bookings/*/*', (route) => {
    calls.push(`answer ${route.request().url().split('/').at(-1)}`);
    status = 'confirmed';
    return json(route, seat());
  });
  // «Yoʻlga chiqdim» and «Yetib keldik» (G63 B1): the list of the trips shows them after.
  const step = (name: string, marks: Trip) => (route: Route) => {
    calls.push(name);
    Object.assign(trip(), marks);
    return json(route, trip());
  };
  await page.route('**/api/driver/trips/*/depart', (route) =>
    step('depart', { departedAt: Date.now() })(route),
  );
  await page.route('**/api/driver/trips/*/arrive', (route) =>
    step('arrive', { arrivedAt: Date.now() })(route),
  );
  await page.route('**/api/driver/trips/*/publicity', (route) => json(route, PUBLICITY));
  await page.route('**/api/reviews', (route) => {
    calls.push(`review ${JSON.stringify(route.request().postDataJSON())}`);
    return route.fulfill({ status: 204 });
  });
  return {
    calls,
    // A passenger asks two seats of the trip.
    ask: () => (status = 'requested'),
    departAt: () => Number(trip()['departAt']),
  };
}
