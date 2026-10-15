import { MY_TRIP_LINK } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';
import { afterSplash, expect, test } from '../crash-guard';
import { confirmedSeat, MINUTE, moveTrip } from './g27-kit';
import { mainButton, phone } from './g33-kit';
import { press } from './g63-kit';
import { MADINA, NODIRA } from './people';
import { PLATFORMS } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, type Person } from './stand-kit';
import { standSql } from './stand-tools';

// G69 (docs/123, docs/124 В) on the whole local Rida: the end of a trip of a driver, «Yetib keldik»
// before the clock ends it, «Safar tugadi» with the stars, then the celebration of 10 passengers.
const { t } = createI18n(DEFAULT_LOCALE);
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WALKS = {
  android: {
    driver: { id: 900695, name: 'Rustam', phone: '998901110695' },
    plate: '01T695UV',
    passenger: { id: 900697, name: 'Gulnoza', phone: '998901110697' },
  },
  ios: {
    driver: { id: 900696, name: 'Akmal', phone: '998901110696' },
    plate: '01T696UV',
    passenger: { id: 900698, name: 'Shahlo', phone: '998901110698' },
  },
} as const;
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await page.screenshot({ path: `screenshots/stand/g69/${name}.png`, animations: 'disabled' });
};

// Nine people the driver brought before: two old trips the clock ended long ago.
function oldTrips(driver: Person) {
  const at = Date.now() - 20 * DAY;
  const trip = (id: string, seats: number) =>
    `('${id}-${driver.id}', ${driver.id}, '1726273', '1718401', ${at}, ${at + HOUR}, 300, ${seats}, 90000, 'completed', ${at})`;
  const seat = (id: string, passenger: Person, seats: number) =>
    `('${id}-${driver.id}', '${id}-${driver.id}', ${passenger.id}, ${seats}, 90000, 9000, 'completed', ${at}, ${at}, ${at})`;
  standSql(`INSERT OR IGNORE INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
    VALUES ${[trip('g69a', 7), trip('g69b', 2)].join(', ')}`);
  standSql(`INSERT OR IGNORE INTO bookings (id, trip_id, passenger_id, seats, price, commission, status, expires_at, created_at, updated_at)
    VALUES ${[seat('g69a', NODIRA, 7), seat('g69b', MADINA, 2)].join(', ')}`);
}

test.setTimeout(180_000);
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test('the driver: «Yetib keldik», «Safar tugadi», then the celebration of 10 passengers', async ({
  browser,
}) => {
  for (const platform of PLATFORMS) {
    const { driver, plate, passenger } = WALKS[platform];
    await approvedDriver(driver, plate);
    await register('passenger', passenger, 'female');
    oldTrips(driver);
    standSql(`DELETE FROM share_moments WHERE user_id = ${driver.id} AND moment LIKE 'riders%'`);
    const { trip, seat } = await confirmedSeat(driver, passenger);
    // On the road for two hours, the passenger in the car; the clock has not ended the trip.
    const left = Date.now() - 2 * HOUR;
    moveTrip(trip.id, left, Date.now() + 2 * HOUR);
    standSql(`UPDATE trips SET departed_at = ${left} WHERE id = '${trip.id}'`);
    standSql(`UPDATE bookings SET boarded_at = ${left} WHERE id = '${seat.id}'`);
    const page = await phone(browser);
    await openAs(page, 'driver', driver, { platform, search: `?${MY_TRIP_LINK}=${trip.id}` });
    await press(page, t('driverTrip.main.arrived'));
    await page.getByLabel(`${passenger.name} 5`, { exact: true }).click();
    await shot(page, `9-trip-done-${platform}`);
    await expect(mainButton(page).filter({ hasText: t('reviews.send') })).toBeVisible();
    await press(page, t('reviews.send'));
    await expect(page.getByText(t('growth.title.riders', { count: '10' }))).toBeVisible();
    await shot(page, `10-moment-riders-${platform}`);
    await page.context().close();
  }
});
