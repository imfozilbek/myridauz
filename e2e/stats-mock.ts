import type { Page } from '@playwright/test';

// The dashboard of the team as the admin Mini App sees it (G12, docs/29).
const steps = (names: readonly string[], counts: readonly number[]) =>
  names.map((step, index) => {
    const count = counts[index] ?? 0;
    const before = counts[index - 1];
    const drop =
      before === undefined
        ? null
        : before === 0
          ? 0
          : Math.max(0, Math.round(((before - count) / before) * 100));
    return { step, count, drop };
  });
const PASSENGER = ['opened', 'searched', 'trip_opened', 'requested', 'chat', 'confirmed', 'boarded'];
const DRIVER = ['opened', 'started', 'submitted', 'approved', 'trip_created', 'confirmed'];
const NEW_TRIP = ['route', 'mode', 'when', 'seats', 'price', 'comment', 'published'];

const statsOf = (period: string) => {
  const week = period === 'week' ? 7 : 1;
  return {
    period,
    numbers: {
      newUsers: 24 * week,
      trips: 9 * week,
      bookings: 17 * week,
      driverApplications: 3 * week,
      complaints: week === 1 ? 1 : 4,
    },
    events: 'on',
    funnels: [
      {
        id: 'passenger',
        steps: steps(
          PASSENGER,
          [320, 210, 150, 60, 44, 38, 31].map((n) => n * week),
        ),
      },
      {
        id: 'driver',
        steps: steps(
          DRIVER,
          [90, 40, 22, 18, 15, 12].map((n) => n * week),
        ),
      },
      {
        id: 'new_trip',
        steps: steps(
          NEW_TRIP,
          [30, 29, 28, 27, 25, 24, 21].map((n) => n * week),
        ),
      },
    ],
    errors: [
      {
        kind: 'refusal',
        app: 'driver',
        screen: 'market.review',
        code: 'trips.too_many',
        what: '',
        count: 7 * week,
      },
      {
        kind: 'refusal',
        app: 'passenger',
        screen: 'bookings.review',
        code: 'bookings.no_seats',
        what: '',
        count: 4 * week,
      },
      {
        kind: 'crash',
        app: 'passenger',
        screen: 'home',
        code: 'render',
        what: 'TypeError: x is undefined',
        count: 1,
      },
    ],
    at: Date.now(),
  };
};

export async function mockStats(page: Page) {
  await page.route('**/api/admin/stats?period=*', (route) =>
    route.fulfill({ json: statsOf(new URL(route.request().url()).searchParams.get('period') ?? 'day') }),
  );
}
