import { loadBrand } from '@platform/brands';
import type { Page } from '@playwright/test';
import team from './fixtures/g83-team.json' with { type: 'json' };

// The waitlist of the team with the numbers of the approved mockups 5 … 8 (G83, docs/181 … 184).
const day = (date: string) => Date.parse(`${date}T05:00:00Z`);
type Ad = [
  code: string,
  target: string,
  place: string,
  name: string,
  at: string,
  terms: number[],
  result: number[],
  price: number,
];
const adOf = ([code, target, place, name, at, [days = 0, top = 0, pin = 0], counts, price]: Ad) => {
  const [clicked, opened, passengers, drivers, joined, stayed] = counts;
  const { bots, mainChannel } = loadBrand();
  const bot = target === 'bot';
  return {
    code,
    link: bot ? `https://t.me/${bots.main}?start=${code}` : 'https://t.me/+Xk2pQa9vLm4yZ',
    target,
    channel: bot ? null : `@${mainChannel}`,
    place,
    name,
    price,
    days: days === 0 ? null : days,
    top,
    pin,
    at: day(at),
    result: { clicked, opened, passengers, drivers, joined, stayed, byFriends: 31 },
  };
};
const ADS = (
  [
    [
      'ad-k7f2qx',
      'bot',
      'telegram',
      'Toshkent eʼlonlari',
      '2026-10-12',
      [3, 1, 24],
      [214, 150, 88, 8, 44, 0],
      300_000,
    ],
    [
      'ad-a1b2c3',
      'channel',
      'telegram',
      'Andijon yangiliklari',
      '2026-10-13',
      [1, 1, 0],
      [0, 0, 60, 4, 320, 281],
      300_000,
    ],
    [
      'ad-d4e5f6',
      'bot',
      'telegram',
      'Haydovchilar guruhi',
      '2026-10-13',
      [0, 0, 48],
      [48, 40, 2, 19, 0, 0],
      200_000,
    ],
    [
      'ad-g7h8i9',
      'bot',
      'instagram',
      'Instagram bloger',
      '2026-10-14',
      [1, 0, 0],
      [96, 60, 16, 2, 0, 0],
      300_000,
    ],
  ] satisfies Ad[]
).map(adOf);

export async function mockTeamWaitlist(page: Page, open = true) {
  const json = (url: string, body: unknown) => page.route(url, (route) => route.fulfill({ json: body }));
  await json('**/api/admin/waitlist', team.overview);
  await json('**/api/admin/waitlist/1718', { ...team.direction, since: Date.parse(team.direction.since) });
  await json('**/api/admin/waitlist-stats*', team.gold);
  await json('**/api/admin/waitlist-switch', { open, at: open ? null : Date.now(), links: ADS.length });
  await json('**/api/admin/ad-links', { links: ADS });
  for (const one of ADS) await json(`**/api/admin/ad-links/${one.code}`, one);
  const numbers = {
    newUsers: 0,
    trips: 0,
    activeTrips: 0,
    bookings: 0,
    driverApplications: 0,
    complaints: 0,
  };
  await json('**/api/admin/stats*', {
    ...{ period: 'week', numbers, arrivals: { sources: [], platforms: [] }, events: 'on' },
    ...{ funnels: team.funnels, errors: [], at: Date.now() },
  });
}
