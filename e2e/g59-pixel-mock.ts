import type { Page } from '@playwright/test';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { tripOf } from './market-mock';

// The data of the approved G59 journey (docs/goals/g59/11-journey-passenger.png) for its Pixel Perfect.
export const MAN = {
  id: '00000000000000000000000000000001',
  firstName: 'Aziz',
  gender: 'male',
  phone: '+998901234567',
  roles: ['passenger'],
  hasAvatar: true,
  writeAccess: false,
  rating: null,
  avatarStatus: null,
  avatarReason: null,
};

// The numbers of the journey: 4 cards, the days 3, 8 and 5 trips.
export async function mockupData(page: Page) {
  const card = (to: string, today: number, tomorrow: number, price: number) => ({
    to,
    today,
    tomorrow,
    price,
  });
  await page.route('**/api/trips/directions?*', (route) =>
    route.fulfill({
      json: {
        directions: [
          card('1718', 3, 8, 90000),
          card('1730', 2, 5, 100000),
          card('1706', 1, 4, 160000),
          card('1703', 0, 3, 110000),
        ],
      },
    }),
  );
  const counts = [3, 8, 5, 0, 0, 0, 0];
  const days = counts.map((trips, index) => ({ date: tashkentDate(Date.now() + index * DAY_MS), trips }));
  await page.route('**/api/trips/days?*', (route) => route.fulfill({ json: { km: 300, days } }));
  // «Ertaga» of the mockup: 08:00 and 13:00, two trips of one seat hidden by «2» people.
  const tomorrow = tashkentDate(Date.now() + DAY_MS);
  const at = (time: string) => ({ departAt: Date.parse(`${tomorrow}T${time}:00+05:00`) });
  const nodira = tripOf('2', 'Nodira', true, 0, { ...at('13:00'), seatsLeft: 2 });
  const trips = [
    tripOf('1', 'Jasur', false, 0, at('08:00')),
    { ...nodira, driver: { ...nodira.driver, rating: { average: 4.8, count: 23 } } },
    tripOf('3', 'Bekzod', false, 0, { ...at('15:00'), seatsLeft: 1 }),
    tripOf('4', 'Akmal', false, 0, { ...at('17:00'), seatsLeft: 1 }),
  ];
  await page.route('**/api/trips?*', (route) => route.fulfill({ json: { trips } }));
  const review = { id: 'r1', authorName: 'Dilshod', stars: 5, tags: [], at: Date.now() };
  await page.route('**/api/users/*/reviews', (route) =>
    route.fulfill({
      json: {
        rating: { average: 4.8, count: 23 },
        reviews: [{ ...review, text: 'Vaqtida keldi, yoʻlda xavfsiz haydadi.' }],
      },
    }),
  );
}
