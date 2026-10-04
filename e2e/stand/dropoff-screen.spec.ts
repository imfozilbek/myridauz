import { expect, test, type Page } from '../crash-guard';
import { TEXT } from '../apps';
import { CHILONZOR, publishTrip } from './market-kit';
import { ELYOR, FARRUX } from './people';
import { pressBack } from '../telegram-mock';
import { mainButton, openHome, PLATFORMS, t, type Platform } from './screen-tour';
import { register } from './seed';
import { outsideCalls, type Person } from './stand-kit';

// The screen of a point (G36, docs/100): the map in full, a sheet at the bottom. The pickup, the
// dropoff found by its name, then again the dropoff by the last place in one tap. A narrow phone.
test.use({ viewport: { width: 320, height: 640 } });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const SEEKERS: Record<Platform, Person> = {
  android: { id: 900797, name: 'Mohira', phone: '998901110797' },
  ios: { id: 900798, name: 'Durdona', phone: '998901110798' },
};
// A route of this scenario only (lesson 95).
const GULISTON = '1724401';
const PLACE = 'Bahor mahallasi';

test.beforeAll(async () => {
  await publishTrip(ELYOR, CHILONZOR, GULISTON, 'door');
  await publishTrip(FARRUX, CHILONZOR, GULISTON, 'door');
  for (const person of Object.values(SEEKERS)) await register('passenger', person, 'female');
});

const shooter = (page: Page, platform: Platform) => async (name: string) => {
  await page.waitForLoadState('networkidle');
  // A map moved to the person a moment ago: its new name came too (lesson 77).
  const pin = page.getByRole('status');
  if ((await pin.count()) > 0) await expect(pin).not.toHaveText(/aniqlanmoqda/u, { timeout: 15_000 });
  await page.screenshot({
    path: `screenshots/stand/dropoff-screen/${platform}/${name}.png`,
    animations: 'disabled',
  });
};
// The map stands and the name under the pin came (lesson 77).
async function mapReady(page: Page, title: 'way.point.from' | 'way.point.to') {
  await expect(page.getByText(t(title))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  await expect(page.getByRole('status')).not.toHaveText(/aniqlanmoqda|hududida emas/u, { timeout: 15_000 });
}
const card = (page: Page, driver: string) => page.locator('.trip-card').filter({ hasText: driver }).first();

for (const platform of PLATFORMS)
  test(`${platform}: the pickup, the dropoff by its name, again by the last place`, async ({ page }) => {
    const shot = shooter(page, platform);
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
    await page.getByAltText('Sirdaryo viloyati').click();
    await page.getByText('Guliston shahri', { exact: true }).click();
    await card(page, ELYOR.name).click();
    await mainButton(page).click();
    await mapReady(page, 'way.point.from');
    await shot('01-pickup');
    await mainButton(page).click();
    await mapReady(page, 'way.point.to');
    await shot('02-dropoff');
    await page.getByPlaceholder(t('bookings.map.search')).fill('Bahor');
    await expect(page.getByText(PLACE, { exact: true })).toBeVisible();
    await shot('03-dropoff-search');
    const before = await page.getByRole('status').textContent();
    await page.getByText(PLACE, { exact: true }).click();
    // The map came to the place: its name under the pin is new (lesson 77).
    await expect(page.getByRole('status')).not.toHaveText(before ?? '', { timeout: 15_000 });
    await expect(page.getByRole('status')).not.toHaveText(/aniqlanmoqda|hududida emas/u, { timeout: 15_000 });
    await shot('04-dropoff-found');
    await mainButton(page).click();
    await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
    await mainButton(page).click();
    await expect(page.getByText(t('bookings.sent.asked'))).toBeVisible();
    // Again with the other driver: the way is kept, «Oʻzgartirish» of the dropoff opens the map.
    const recent = page.getByText(t('home.driver.last'));
    await expect(async () => {
      if (!(await recent.isVisible())) await pressBack(page);
      await expect(recent).toBeVisible({ timeout: 1000 });
    }).toPass();
    await page
      .getByText(/→ Guliston shahri$/u)
      .last()
      .click();
    await card(page, FARRUX.name).click();
    await mainButton(page).click();
    await page.getByText(t('way.change')).last().click();
    await mapReady(page, 'way.point.to');
    await shot('05-dropoff-recent');
    // One tap on the last place: the review at once, no «Shu yerda» (DS3).
    await page.locator('.way-recent').getByText('Guliston shahri').first().click();
    await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
    await shot('06-review');
  });
