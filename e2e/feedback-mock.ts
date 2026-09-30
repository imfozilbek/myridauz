import type { Page, Route } from '@playwright/test';

// Ratings, reviews and complaints as the Mini Apps see them (G11).
const DAY = 24 * 3_600_000;
const party = (id: number, firstName: string, role: 'driver' | 'passenger', trips: number) => ({
  id,
  firstName,
  hasAvatar: false,
  role,
  trips,
  complaints: role === 'driver' ? 2 : 0,
});
const complaint = (id: string, reason: string, high: boolean, hours: number) => ({
  id,
  reason,
  high,
  comment: high ? 'Yoʻlda qoʻpol gapirdi va tezlikni oshirdi.' : '',
  status: 'new',
  createdAt: Date.now() - hours * 3_600_000,
  tripId: 't1',
  departAt: Date.now() - DAY,
  author: party(101, 'Madina', 'passenger', 4),
  against: party(11, 'Jasur', 'driver', 23),
});
const QUEUE = [complaint('c1', 'harassment', true, 2), complaint('c2', 'no_show', false, 20)];
const REVIEWS = [
  {
    id: 'r1',
    authorName: 'Madina',
    stars: 5,
    tags: ['on_time'],
    text: 'Vaqtida yetib keldik, rahmat!',
    at: Date.now() - DAY,
  },
  { id: 'r2', authorName: 'Aziz', stars: 4, tags: [], text: '', at: Date.now() - 3 * DAY },
];

export async function mockFeedback(page: Page) {
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  await page.route('**/api/reviews/b1', (route) =>
    json(route, { rateeId: 7, rateeName: 'Jasur', rateeRole: 'driver', mine: null }),
  );
  await page.route('**/api/reviews', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/complaints', (route) => json(route, { id: 'c9' }, 201));
  await page.route('**/api/users/*/reviews', (route) =>
    json(route, { rating: { average: 4.9, count: 23 }, reviews: REVIEWS }),
  );
  await page.route('**/api/admin/complaints', (route) => json(route, { complaints: QUEUE }));
  await page.route('**/api/admin/complaints/c1', (route) => json(route, QUEUE[0]));
  await page.route('**/api/admin/complaints/c1/chat', (route) =>
    json(route, {
      lines: [
        { author: null, text: 'confirmed', at: Date.now() - 2 * DAY },
        { author: 101, text: 'Assalomu alaykum, soat 8 da chiqamanmi?', at: Date.now() - 2 * DAY },
        { author: 11, text: 'Ha, tezroq boʻling, kutib oʻtirmayman.', at: Date.now() - 2 * DAY },
      ],
    }),
  );
  await page.route('**/api/admin/complaints/c1/decision', (route) => route.fulfill({ status: 204 }));
}
