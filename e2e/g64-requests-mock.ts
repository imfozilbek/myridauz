import type { Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, openRequests } from './apps';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The data of the mockups g64/1 … g64/3, one to one (lesson 151): today is 6 October, Sardor asks
// the whole car Chilonzor → Samarqand, Dilnoza with a woman from Sergeli, Nilufar Yunusobod → Termiz.
const [, DRIVER] = MINI_APPS;
export const tashkent = (time: string) => Date.parse(`${time}+05:00`);
const TODAY = '2026-10-06';
export const TOMORROW = '2026-10-07';
const RATING = { average: 4.8, count: 12 };
const SAMARQAND = '1718401';

const ask = (n: number, name: string, from: string, to: string, extra: object) => ({
  id: `00000000-0000-4000-8000-0000000000a${n}`,
  passenger: { id: `0000000000000000000000000000${n}0af`, firstName: name, hasAvatar: false, rating: RATING },
  from,
  to,
  km: 300,
  status: 'open',
  wholeCar: false,
  withWoman: false,
  callsOff: false,
  ...extra,
});
export const sardor = (date: string) =>
  ask(1, 'Sardor', '1726294', SAMARQAND, {
    date,
    seats: 2,
    price: 90000,
    pickupMode: 'pitak',
    wholeCar: true,
  });
const dilnoza = (date: string) =>
  ask(2, 'Dilnoza', '1726283', SAMARQAND, {
    date,
    seats: 2,
    price: 95000,
    pickupMode: 'door',
    withWoman: true,
  });
const nilufar = (date: string) =>
  ask(3, 'Nilufar', '1726266', '1722401', { date, seats: 1, price: 210000, pickupMode: 'door' });

const DAYS = [
  { date: TODAY, count: 3 },
  { date: TOMORROW, count: 5 },
  { date: '2026-10-08', count: 1 },
];
// The trip of the driver for the screens of g64/1 phone 2 and g64/2 phone 1: tomorrow at 08:00.
const TRIP = tripOf('7', 'Jasur', false, 0, { departAt: tashkent(`${TOMORROW}T08:00`) });

export type Board = 'today' | 'trip' | 'salon' | 'nilufar';
const BOARDS = {
  today: { date: TODAY, trip: null, fits: [], others: [sardor(TODAY), dilnoza(TODAY), nilufar(TODAY)] },
  trip: {
    date: TOMORROW,
    trip: TRIP,
    fits: [
      { ...sardor(TOMORROW), extraKm: 2 },
      { ...dilnoza(TOMORROW), withWoman: false, extraKm: 4 },
    ],
    others: [nilufar(TOMORROW)],
  },
  salon: { date: TOMORROW, trip: null, fits: [], others: [sardor(TOMORROW), nilufar(TOMORROW)] },
  // Under the sheet of g64/1 phone 3 the mockup keeps only the card of Nilufar.
  nilufar: { date: TODAY, trip: null, fits: [], others: [nilufar(TODAY)] },
} as const;

// «Yoʻlovchilar soʻrovlari» of an approved driver at noon of 6 October (the times of the sheet
// start at 14:00, as on g64/1 phone 3).
export async function openBoard(page: Page, board: Board) {
  await mockApi(page, 'active');
  await page.route('**/api/driver/requests/board*', (route) =>
    route.fulfill({ json: { known: true, days: DAYS, carSeats: 4, ...BOARDS[board] } }),
  );
  await page.clock.setFixedTime(tashkent(`${TODAY}T12:20`));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await openRequests(page);
  await page.locator('.request-row').first().waitFor();
}
