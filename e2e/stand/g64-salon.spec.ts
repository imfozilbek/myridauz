import type { BrowserContext } from '@playwright/test';
import { createMarketClient } from '@platform/api-client';
import { REQUESTS_LINK, requestsLinkValue } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from '../crash-guard';
import { dayAfterTomorrow } from './g27-kit';
import { seen } from './g63-kit';
import { answerByBot, asks, person, rowOf, seedWalk, shoot, QARSHI, type Walk } from './g64-kit';
import { CHILONZOR } from './market-kit';
import { freshDriver } from './schedule-kit';
import { mainButton, NARROW, PLATFORMS, t, type Platform } from './screen-tour';

const { formatNumber } = createI18n(DEFAULT_LOCALE);
import { CAR } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';

// G64 (docs/118 path 7) on the whole local Rida, Android and iOS: a «Boʻsh salon kerak» request on a
// day without a trip. «Safar ochib taklif qilish» fills the trip from the request in one sheet; only
// its passenger sees it until the answer; after «Rad etish» the driver opens it to all.
type Salon = Walk & { readonly salon: Person; readonly other: Person };
const WALKS: Record<Platform, Salon> = {
  android: {
    platform: 'android',
    driver: person(900681, 'Sanjar'),
    plate: '01T681UV',
    salon: person(900683, 'Sevara'),
    other: person(900685, 'Munisa'),
  },
  ios: {
    platform: 'ios',
    driver: person(900682, 'Otabek'),
    plate: '01T682UV',
    salon: person(900684, 'Gulnoza'),
    other: person(900686, 'Hilola'),
  },
};

test.use({ viewport: NARROW });
test.setTimeout(180_000);
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test.beforeAll(async () => {
  for (const walk of Object.values(WALKS)) await seedWalk(walk, [walk.salon, walk.other]);
});

// The trips of the driver another passenger finds on that day.
async function seenByOthers(walk: Salon, date: string) {
  const market = createMarketClient(await signedAs('passenger', walk.other));
  const trips = await market.searchTrips({ from: CHILONZOR, to: QARSHI, date });
  return trips.filter((trip) => trip.driver.firstName === walk.driver.name).length;
}

async function forSalon(context: BrowserContext, page: Page, walk: Salon) {
  const date = dayAfterTomorrow();
  const request = await asks(walk.salon, date, true);
  // The bot link of a new request on the route of the driver (docs/83 N08).
  const search = `?${REQUESTS_LINK}=${requestsLinkValue(CHILONZOR, QARSHI, date)}`;
  await openAs(page, 'driver', walk.driver, { platform: walk.platform, search });
  await rowOf(page, walk.salon)
    .getByRole('button', { name: t('requests.action.salon') })
    .click();
  await expect(mainButton(page)).toHaveText(t('requests.action.salon'));
  // Every seat of the car at the price of the request, also when a bot link opened the board.
  const sum = { seats: String(CAR.seats), price: formatNumber(request.price) };
  await seen(page, t('requests.salon.sum', { ...sum, sum: formatNumber(CAR.seats * request.price) }));
  await shoot(page, walk, '08-salon-sheet');
  await mainButton(page).click();
  await seen(page, t('driverTrip.private.waiting.title', { name: walk.salon.name }));
  await shoot(page, walk, '09-salon-waiting');
  expect(await seenByOthers(walk, date)).toBe(0);
  const phone = await answerByBot(context, walk, walk.salon, request, 'decline');
  await phone.close();
  // «Mening safarim» changes by itself (docs/64): the refusal and the way to open the trip.
  await seen(page, t('driverTrip.private.declined.title', { name: walk.salon.name }));
  await shoot(page, walk, '10-salon-declined');
  await page.getByRole('button', { name: t('driverTrip.private.open') }).click();
  await expect(page.getByText(t('driverTrip.private.open'))).toHaveCount(0);
  await expect.poll(() => seenByOthers(walk, date)).toBe(1);
  await shoot(page, walk, '11-salon-open');
}

for (const platform of PLATFORMS)
  test(`${platform}: a trip for a whole car, seen by its passenger only, opened to all after «Rad etish»`, async ({
    page,
    context,
  }) => {
    const walk = WALKS[platform];
    freshDriver(walk.driver);
    await forSalon(context, page, walk);
  });
