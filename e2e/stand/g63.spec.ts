import type { BrowserContext } from '@playwright/test';
import { channelOf, loadBrand } from '@platform/brands';
import { MEET_BEFORE_MINUTES, MY_TRIP_LINK, tripEndsAt, type Trip } from '@platform/contracts';
import { expect, test, type Page } from '../crash-guard';
import { pressBack } from '../telegram-mock';
import { MINUTE, moveTrip, SAMARQAND, toldBy, wordsOf } from './g27-kit';
import {
  bookAndConfirm,
  commissionOf,
  press,
  publishOnOneScreen,
  SEATS,
  seatsLeft,
  seen,
  shoot,
  type Walk,
} from './g63-kit';
import { freshDriver } from './schedule-kit';
import { mainButton, NARROW, PLATFORMS, t, type Platform } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls } from './stand-kit';

// G63 (docs/143, docs/118 path 6) on the whole local Rida, Android and iOS: a driver publishes on
// one screen, a passenger books on a second phone, the meeting, the way and the end of the trip.
// The shots go to screenshots/stand/g63/ for the owner (docs/33) with pnpm stand:check --shots.
// Drivers and passengers of their own: no other scenario of the stand shares their ids, phones or cars.
const WALKS: Record<Platform, Walk & { readonly plate: string }> = {
  android: {
    platform: 'android',
    driver: { id: 900663, name: 'Sherali', phone: '998901110663' },
    plate: '01T663UV',
    passenger: { id: 900665, name: 'Gulruh', phone: '998901110665' },
  },
  ios: {
    platform: 'ios',
    driver: { id: 900664, name: 'Ravshan', phone: '998901110664' },
    plate: '01T664UV',
    passenger: { id: 900666, name: 'Mohira', phone: '998901110666' },
  },
};
// One star less than the five of «Safar tugadi»: the past trip shows the stars the server keeps.
const STARS = 4;
// The trip goes to Samarqand: the channel of its zone posts it (docs/63), by its Telegram name (docs/37).
const BRAND = loadBrand();
const CHANNEL = t('driverTrip.channel.name', {
  brand: BRAND.name,
  title: channelOf(BRAND, SAMARQAND)?.title ?? '',
});

test.use({ viewport: NARROW });
test.setTimeout(180_000);
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test.beforeAll(async () => {
  for (const walk of Object.values(WALKS)) {
    await approvedDriver(walk.driver, walk.plate);
    await register('passenger', walk.passenger, 'female');
  }
});

// 3. The clock of the stand moves to the opening of the meeting, 30 minutes before the departure
// (docs/126); the bot button opens the trip again: «Yoʻl xaritasi», the point, «Men keldim»,
// «Keldi», then «Yoʻlga chiqdim» on the main button (mockup g63/4 screens 11, 12, 13). It returns the page of the driver that is open now.
async function meetAndLeave(context: BrowserContext, page: Page, walk: Walk, trip: Trip) {
  const departAt = Date.now() + MEET_BEFORE_MINUTES * MINUTE;
  moveTrip(trip.id, departAt, tripEndsAt(departAt, trip.km));
  await page.close();
  const later = await context.newPage();
  const search = `?${MY_TRIP_LINK}=${trip.id}`;
  await openAs(later, 'driver', walk.driver, { platform: walk.platform, search });
  const free = String(trip.seats - SEATS);
  await seen(later, t('driverTrip.soon.sub', { passengers: String(SEATS), seats: free }));
  // The channel posted the trip and the passenger of step 2 opened it (docs/119).
  await seen(later, t('driverTrip.channel.views', { channel: CHANNEL, count: '1' }));
  await expect(mainButton(later)).toHaveText(t('driverTrip.main.departed'));
  await shoot(later, walk, '06-soon');
  await later.getByText(t('driverTrip.tile.map')).click();
  await later.locator('.trip-map-stop').first().click();
  await later.getByRole('button', { name: t('bookings.meeting.came') }).click();
  await toldBy('passenger', walk.passenger, wordsOf('bot.booking.driverCame'));
  await shoot(later, walk, '07-came');
  await later.getByRole('button', { name: t('driverAfter.meet.met'), exact: true }).click();
  await expect(later.locator('.meet-done')).toHaveText(t('driverAfter.meet.met'));
  await shoot(later, walk, '08-met');
  // Back to the map, then back to «Mening safarim».
  await pressBack(later);
  await pressBack(later);
  await press(later, t('driverTrip.main.departed'));
  await seen(later, t('driverTrip.onWay.title'));
  await expect(mainButton(later)).toHaveText(t('driverTrip.main.arrived'));
  await shoot(later, walk, '09-on-way');
  return later;
}

// 4. «Yetib keldik»: «Safar tugadi» once with what the wallet gave and the stars, «Yuborish»,
// «Qaytish», then the past trip with the stars the server keeps (docs/143 §4).
async function arriveAndRate(page: Page, walk: Walk, trip: Trip) {
  await press(page, t('driverTrip.main.arrived'));
  await seen(page, t('driverAfter.done.rate'));
  await seen(page, t('driverAfter.done.charged', { amount: commissionOf(trip) }));
  await seen(page, t('driverAfter.done.left', { seats: await seatsLeft(walk.driver, trip) }));
  await page.getByLabel(`${walk.passenger.name} ${STARS}`, { exact: true }).click();
  await shoot(page, walk, '10-done');
  await press(page, t('reviews.send'));
  await seen(page, t('driverAfter.back.title'));
  await expect(mainButton(page)).toHaveText(t('driverAfter.back.publish'));
  await shoot(page, walk, '11-return');
  await pressBack(page);
  await seen(page, t('driverAfter.past.after'));
  await seen(page, t('driverAfter.past.rated', { stars: t('find.star').repeat(STARS) }));
  await shoot(page, walk, '12-past');
}

for (const platform of PLATFORMS)
  test(`${platform}: publish, a seat asked and confirmed, the meeting, the way, the end`, async ({
    page,
    context,
  }) => {
    const walk = WALKS[platform];
    freshDriver(walk.driver);
    // 1 and 2: e2e/stand/g63-kit.ts.
    const trip = await publishOnOneScreen(page, walk);
    await bookAndConfirm(context, page, walk, trip);
    const later = await meetAndLeave(context, page, walk, trip);
    await arriveAndRate(later, walk, trip);
  });
