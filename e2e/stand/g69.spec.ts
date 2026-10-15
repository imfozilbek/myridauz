import { BOOKING_LINK, REQUEST_LINK } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';
import { loadBrand } from '../../brands/index';
import { afterSplash, expect, test } from '../crash-guard';
import { askRide, confirmedSeat, MINUTE, moveTrip } from './g27-kit';
import { mainButton, phone } from './g33-kit';
import { OWNER } from './people';
import { PLATFORMS } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, type Person } from './stand-kit';
import { runCron, standSql } from './stand-tools';

// G69 (docs/123) on the whole local Rida, Android and iOS: the celebration after the registration, the
// loops 2 and 3, no celebration after the review (owner decision 15.10.2026), «Sizning taʼsiringiz»,
// the QR of a new driver and «Rost» of the owner. The shots go to screenshots/stand/g69/ (docs/33).
const { t } = createI18n(DEFAULT_LOCALE);
const brand = loadBrand().name;
const HOUR = 60 * MINUTE;
// People of their own: no other scenario shares their ids, phones or cars.
const DRIVER: Person = { id: 900690, name: 'Jasur', phone: '998901110690' };
const PASSENGERS = {
  android: { id: 900691, name: 'Madina', phone: '998901110691' },
  ios: { id: 900692, name: 'Dilnoza', phone: '998901110692' },
} as const;
const NEW_DRIVERS = {
  android: { person: { id: 900693, name: 'Sardor', phone: '998901110693' }, plate: '01T693UV' },
  ios: { person: { id: 900694, name: 'Bekzod', phone: '998901110694' }, plate: '01T694UV' },
} as const;
// The splash leaves first (docs/121 §4); a long screen gets a second shot of its end.
async function shot(page: Page, name: string, end = false) {
  await afterSplash(page);
  await page.screenshot({ path: `screenshots/stand/g69/${name}.png`, animations: 'disabled' });
  if (!end) return;
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: `screenshots/stand/g69/${name}-end.png`, animations: 'disabled' });
}
// The moments of a person come back: the scenarios of the stand take them away at the registration.
const uncelebrate = (person: Person) => standSql(`DELETE FROM share_moments WHERE user_id = ${person.id}`);
const later = (page: Page) => page.getByRole('button', { name: t('growth.later') }).click();

test.setTimeout(240_000);
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test.beforeAll(async () => {
  await approvedDriver(DRIVER, '01T690UV');
  for (const passenger of Object.values(PASSENGERS)) await register('passenger', passenger, 'female');
  await runCron();
});

test('the passenger: the celebrations, the group of the district and the free seats', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const passenger = PASSENGERS[platform];
    uncelebrate(passenger);
    const first = await phone(browser);
    await openAs(first, 'passenger', passenger, { platform });
    await expect(first.getByText(t('growth.title.join', { brand }))).toBeVisible();
    await shot(first, `1-join-${platform}`, true);
    await later(first);
    await first.context().close();
    // Loop 2: the request with no offer goes into the group of the district.
    const request = await askRide(passenger);
    const asking = await phone(browser);
    await openAs(asking, 'passenger', passenger, { platform, search: `?${REQUEST_LINK}=${request.id}` });
    await expect(asking.getByText(t('growth.group.title'))).toBeVisible();
    await shot(asking, `2-request-group-${platform}`);
    await asking.context().close();
    standSql(`UPDATE ride_requests SET status = 'cancelled' WHERE id = '${request.id}'`);
    // Loop 3: the free seats of the booked car.
    const { trip, seat } = await confirmedSeat(DRIVER, passenger);
    const booked = await phone(browser);
    await openAs(booked, 'passenger', passenger, { platform, search: `?${BOOKING_LINK}=${seat.id}` });
    await expect(booked.getByText(t('growth.seats.button'))).toBeVisible();
    await shot(booked, `3-seats-${platform}`);
    await booked.context().close();
    // The trip is over: the review, then the seat again, no celebration (owner decision 15.10.2026).
    moveTrip(trip.id, Date.now() - 6 * HOUR, Date.now() - HOUR);
    standSql(`UPDATE trips SET status = 'completed' WHERE id = '${trip.id}'`);
    standSql(`UPDATE bookings SET status = 'completed' WHERE id = '${seat.id}'`);
    const rating = await phone(browser);
    await openAs(rating, 'passenger', passenger, { platform, search: `?${BOOKING_LINK}=${seat.id}` });
    await rating.getByText(t('bookings.done.rate')).click();
    await rating.getByLabel('5', { exact: true }).click();
    await mainButton(rating)
      .filter({ hasText: t('reviews.send') })
      .click();
    await expect(rating.locator('.booking-buttons')).toBeVisible();
    await expect(rating.getByRole('button', { name: t('growth.later') })).toHaveCount(0);
    await shot(rating, `4-after-review-${platform}`);
    await rating.context().close();
  }
});

test('the profile: «Sizning taʼsiringiz»', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const passenger = PASSENGERS[platform];
    const page = await phone(browser);
    await openAs(page, 'passenger', passenger, { platform });
    await page.getByText(passenger.name).first().click();
    await page.getByRole('button', { name: new RegExp(`^${t('growth.impact.title')}`, 'u') }).click();
    await expect(page.getByText(t('growth.impact.badge.companion'))).toBeVisible();
    await shot(page, `5-impact-${platform}`);
    await page.context().close();
  }
});

test('a new driver: the celebration of the approval and the QR on the glass', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const { person, plate } = NEW_DRIVERS[platform];
    await approvedDriver(person, plate);
    uncelebrate(person);
    const page = await phone(browser);
    await openAs(page, 'driver', person, { platform });
    await expect(page.getByText(t('growth.title.driver', { brand }))).toBeVisible();
    await shot(page, `6-driver-moment-${platform}`, true);
    await later(page);
    await page.getByText(person.name).first().click();
    await page.getByText(t('growth.qr.title')).click();
    await expect(page.getByRole('img', { name: t('growth.qr.picture', { brand }) })).toBeVisible();
    await shot(page, `7-qr-${platform}`);
    await page.context().close();
  }
});

test('the owner: «Rost»', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const page = await phone(browser);
    await openAs(page, 'admin', OWNER, { platform });
    await page.getByText(t('common.admin.management')).first().click();
    await page.getByText(t('growth.rost.title'), { exact: true }).click();
    await expect(page.getByText(t('growth.rost.loop.qr'))).toBeVisible();
    await shot(page, `8-rost-${platform}`);
    await page.context().close();
  }
});
