import type { Page, Route } from '@playwright/test';
import { confirmed, offer } from './bookings-mock';
import { tashkent } from './g63-after-mock';
import { request, tripOf } from './market-mock';

// The data of the mockups g68/7 and g68/8, one to one (lesson 151): Jasur drives from Chilonzor to
// Samarqand tomorrow at 08:00, Madina asks for 2 seats, 100 000 a seat; 7 October, 15:00.
export const NOW = tashkent('2026-10-07T15:00');
export const DEPART = tashkent('2026-10-08T08:00');
const YUNUSOBOD = '1726266';
const MINUTE = 60_000;
const id = (n: string) => `00000000-0000-4000-8000-0000000000${n}`;
const person = (n: string, firstName: string) => ({
  id: `000000000000000000000000000000${n}`,
  firstName,
  hasAvatar: true,
  rating: { average: 4.8, count: 12 },
});
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC' };
const driver = { ...person('0b', 'Jasur'), rating: { average: 4.9, count: 23 }, car };
export const trip = tripOf('9', 'Jasur', false, 0, {
  driver,
  departAt: DEPART,
  firstDepartAt: DEPART,
  seats: 4,
  seatsLeft: 4,
  price: 100000,
  pitak: null,
});
const grand = { point: null, name: null, area: { step: 'landmark', name: 'Grand' } };

// A new request to the driver: Madina, 2 seats, near «Grand», 29 minutes to answer (screen 3).
export const ask = (n: string, firstName: string) => ({
  ...confirmed,
  id: id(n),
  trip,
  status: 'requested',
  passenger: person(n, firstName),
  seats: 2,
  price: 100000,
  commission: 20000,
  mode: 'door',
  pitak: null,
  pickup: grand,
  expiresAt: NOW + 29.5 * MINUTE,
  confirmedAt: null,
  plate: null,
});

// The offer of the driver taken by Aziz for the whole car, 09:00 from Yunusobod (screen 6).
export const taken = {
  ...ask('a1', 'Aziz'),
  trip: { ...trip, from: YUNUSOBOD, departAt: tashkent('2026-10-08T09:00') },
  status: 'confirmed',
  seats: 3,
  wholeCar: true,
  confirmedAt: NOW - MINUTE,
  chatKey: `o${id('a1')}`,
};

// The seat of Madina with Jasur, confirmed long ago, at «Grand» (g68/8 «Xabar», «Uchrashuv»).
export const seat = {
  ...confirmed,
  id: id('b1'),
  trip,
  seats: 2,
  price: 100000,
  plate: '01A123BC',
  confirmedAt: NOW - 2 * 24 * 60 * MINUTE,
  pickup: { point: { lat: 41.2856, lng: 69.2034 }, name: { step: 'landmark', name: 'Grand' }, area: null },
  chatKey: `b${id('b1')}`,
};

// The open request of Madina to Samarqand tomorrow and two offers of Jasur on it (g68/8 «Taklif»).
export const asked = { ...request, id: id('r1'), date: '2026-10-08' };
export const offers = ['c1', 'c2'].map((n) => ({
  ...offer,
  id: id(n),
  requestId: asked.id,
  driver,
  departAt: DEPART,
  seats: 2,
  price: 100000,
  pitak: null,
}));

const json = (route: Route, body: unknown) => route.fulfill({ json: body });

// The lists of a main screen as the sheet needs them, then the screen loads again with them.
export async function withLists(page: Page, lists: Record<string, unknown>) {
  for (const [path, body] of Object.entries(lists))
    await page.route(`**/api/${path}`, (route) =>
      route.request().method() === 'GET' ? json(route, body) : route.fallback(),
    );
  await page.reload();
}
