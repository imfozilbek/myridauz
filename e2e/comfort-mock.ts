import type { Page, Route } from '@playwright/test';
import { tripOf } from './market-mock';

// "Sevimli haydovchilar", "Safarlar tarixi" and the driver's shared trip (G18) as the Mini Apps see them.
const CHILONZOR = '1726294';
const SAMARQAND = '1718401';
const DAY = 86_400_000;
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white' };
const past = (id: string, days: number, people: string[], given: number | null, received: number | null) => ({
  id: `00000000-0000-4000-8000-0000000000c${id}`,
  from: CHILONZOR,
  to: SAMARQAND,
  departAt: Math.floor(Date.now() / DAY) * DAY - days * DAY + 3 * 3_600_000,
  km: 300,
  price: 90000,
  seats: people.length,
  people,
  given,
  received,
});

export async function mockComfort(page: Page) {
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  const saved = new Set<number>([11]);
  const jasur = {
    id: '0000000000000000000000000000000b',
    firstName: 'Jasur',
    hasAvatar: false,
    car,
    rating: { average: 4.9, count: 23 },
  };
  await page.route('**/api/passenger/favorites', (route) =>
    json(route, {
      drivers: saved.has(11) ? [jasur] : [],
      trips: saved.has(11) ? [tripOf('1', 'Jasur', false, 26, { hasMeetingPoint: true })] : [],
    }),
  );
  await page.route('**/api/passenger/favorites/*', (route) => {
    const id = Number(route.request().url().split('/').pop());
    if (route.request().method() === 'PUT') saved.add(id);
    else saved.delete(id);
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/passenger/history', (route) =>
    json(route, { trips: [past('1', 3, ['Jasur'], 5, 5), past('2', 12, ['Nodira'], 4, null)] }),
  );
  await page.route('**/api/driver/history', (route) =>
    json(route, { trips: [past('3', 2, ['Madina', 'Aziz'], null, 4.5)] }),
  );
  await page.route('**/api/driver/trips/*/share', (route) =>
    json(route, { preparedMessageId: null, link: 'https://t.me/test_bot?start=follow_x' }, 201),
  );
  await page.route('**/api/driver/trips/*/share/stop', (route) => route.fulfill({ status: 204 }));
}
