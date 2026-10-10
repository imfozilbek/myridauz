import type { Page } from '@playwright/test';
import { tripOf } from './market-mock';
import { id } from './team-mock';

// The cases and «Boshqaruv» as on the mockup g67/2 screens 3 … 6 (G75): Jasur's Cobalt with the same
// plate once more, Madina's complaint about Jasur, Madina's face photo; the lines of «Boshqaruv».
const HOUR = 60 * 60_000;
const json = (page: Page, path: string, body: unknown) =>
  page.route(path, (route) => route.fulfill({ json: body }));
const party = (n: number, firstName: string, role: 'driver' | 'passenger') => ({
  id: id(n),
  firstName,
  hasAvatar: false,
  role,
  trips: 3,
  complaints: 0,
});

export async function mockCases(page: Page) {
  await json(page, `**/api/admin/applications/${id(2)}`, {
    userId: id(2),
    firstName: 'Jasur',
    status: 'pending',
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    reasons: [],
    submittedAt: Date.now() - HOUR,
    history: [],
    samePlate: 1,
    was: null,
    gender: 'male',
  });
  // The photos are places with their names on the mockup.
  await page.route('**/api/admin/applications/*/photos/*', (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  // «Kech qoldi» of the mockup is no reason of the app (docs/17): «Boshqa» stands for it.
  await json(page, '**/api/admin/complaints/c1', {
    id: 'c1',
    reasons: ['other'],
    high: false,
    comment: 'Haydovchi 40 daqiqa kech keldi, telefonni olmadi.',
    status: 'new',
    createdAt: Date.now() - 2 * HOUR,
    tripId: 't1',
    departAt: Date.now() - 30 * HOUR,
    author: party(4, 'Madina', 'passenger'),
    against: party(2, 'Jasur', 'driver'),
    refund: null,
  });
  // The trip of the complaint: Jasur to Samarqand, done (mockup «5-okt 08:00 · Safar tugadi»).
  await json(page, '**/api/trips/t1', tripOf('1', 'Jasur', false, -30, { status: 'completed' }));
  await page.route(`**/api/admin/faces/${id(4)}/photo`, (route) =>
    route.fulfill({ path: 'e2e/fixtures/face.jpg' }),
  );
}

export async function mockManagement(page: Page) {
  const health = (n: number, subscribers: number) => ({
    username: `zone_${n}`,
    title: `zone ${n}`,
    subscribers,
    canPost: true,
    checkedAt: 1,
    failed: 0,
    arrivals: 3,
  });
  await json(page, '**/api/admin/channel-health', {
    channels: Array.from({ length: 20 }, (_, n) => health(n, n === 0 ? 41_200 - 19 * 2000 : 2000)),
  });
  await json(page, '**/api/admin/team', {
    members: [1, 2, 3].map((n) => ({ id: id(n), firstName: `M${n}`, hasAvatar: false, role: 'moderator' })),
  });
  const pitak = (n: number) => ({
    id: `p${n}`,
    name: `Pitak ${n}`,
    point: { lat: 41.25, lng: 69.19 },
    regionId: '1726',
    status: 'claude',
    updatedAt: 1,
  });
  await json(page, '**/api/admin/pitaks', {
    pitaks: Array.from({ length: 64 }, (_, n) => pitak(n)),
    directions: [],
  });
  await json(page, '**/api/admin/trips*', {
    trips: Array.from({ length: 17 }, (_, n) => tripOf(String(n), 'Jasur', false, 2)),
  });
}
