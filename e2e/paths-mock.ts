import type { Page } from '@playwright/test';

// G99 (docs/234): the paths by source and Telegram as the admin Mini App sees them.
const steps = (names: readonly string[], counts: readonly number[]) =>
  names.map((step, index) => {
    const count = counts[index] ?? 0;
    const before = counts[index - 1];
    const drop =
      before === undefined ? null : before === 0 ? 0 : Math.round(((before - count) / before) * 100);
    return { step, count, drop };
  });
const PASSENGER = [
  'opened',
  'from',
  'to',
  'searched',
  'found',
  'trip_opened',
  'requested',
  'confirmed',
  'rode',
];
const DRIVER = ['opened', 'submitted', 'approved', 'trip_created', 'first_booking', 'trip_done'];
const paths = (passenger: readonly number[], driver: readonly number[]) => [
  { role: 'passenger', steps: steps(PASSENGER, passenger) },
  { role: 'driver', steps: steps(DRIVER, driver) },
];
const slice = (people: number, errors: number) => ({
  people,
  errors,
  // A believable path: each step keeps a share of the people of the first one.
  paths: paths(
    [1, 0.74, 0.69, 0.62, 0.29, 0.24, 0.12, 0.1, 0.07].map((share) => Math.round(people * share)),
    [0.14, 0.07, 0.05, 0.05, 0.02, 0.02].map((share) => Math.round(people * share)),
  ),
});

const pathsOf = (period: string) => ({
  period,
  events: 'on',
  sources: [
    { kind: 'channel', ...slice(42, 3) },
    { kind: 'group', ...slice(18, 0) },
    { kind: 'ad', ...slice(11, 1) },
    { kind: 'bot', ...slice(9, 0) },
    { kind: 'direct', ...slice(35, 6) },
  ],
  versions: [
    { tg: 'v8', ...slice(96, 2) },
    { tg: 'v7', ...slice(14, 3) },
    { tg: 'old', ...slice(4, 5) },
  ],
  platforms: [
    { platform: 'android', ...slice(71, 4) },
    { platform: 'ios', ...slice(33, 1) },
    { platform: 'tdesktop', ...slice(6, 0) },
    { platform: 'unknown', ...slice(4, 5) },
  ],
  at: Date.parse('2026-11-13T12:00:00Z'),
});

export async function mockPaths(page: Page) {
  await page.route('**/api/admin/stats/paths?period=*', (route) =>
    route.fulfill({ json: pathsOf(new URL(route.request().url()).searchParams.get('period') ?? 'day') }),
  );
  await page.route('**/api/admin/stats/paths/file?period=*', (route) => route.fulfill({ status: 204 }));
}
