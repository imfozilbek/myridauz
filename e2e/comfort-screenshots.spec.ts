import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { findTrips, publishTrip } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER, ADMIN] = MINI_APPS;
const shooter = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/comfort-${name}.png`, fullPage: true });
};
const open = async (page: Page, port: number) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(port)));
  return shooter(page);
};

// The screens of G18 for the owner review (docs/33).
// A driver is saved on «Baho» after the trip (mockup screen 17), not on «Safar».
test('passenger: the trip of a driver', async ({ page }) => {
  const shot = await open(page, PASSENGER.port);
  await findTrips(page);
  await expect(page.getByText(t('find.seatsTitle'))).toBeVisible();
  await shot('1-trip');
});

test('passenger: "Sevimli haydovchilar"', async ({ page }) => {
  const shot = await open(page, PASSENGER.port);
  await page.getByText(t('common.myTrips')).click();
  // «Obunalar» and «Sevimli haydovchilar» open from «Oʻtgan» (mockup g75/2 A).
  await page.getByText(t('bookings.tab.past')).click();
  await page.getByText(t('comfort.favorites.title')).click();
  await expect(page.getByText(t('comfort.favorites.drivers'), { exact: true })).toBeVisible();
  await shot('3-favorites');
});

// Published, «Mening safarim» of the new trip opens at once (G63): the family gets it from there.
test('driver: the trip just published, shared with the family', async ({ page }) => {
  const shot = await open(page, DRIVER.port);
  await publishTrip(page);
  // «Yaqinlarimga» is a tile of «Mening safarim» (G63, mockup g63/3).
  await expect(page.getByText(t('bookings.toClose'))).toBeVisible();
  await shot('7-driver-share');
});

test('admin: the median of real prices as a hint', async ({ page }) => {
  const shot = await open(page, ADMIN.port);
  await page.getByText(TEXT.management).click();
  await page.getByText(TEXT.pricing, { exact: true }).click();
  await page
    .getByText(/^Formula: /u)
    .first()
    .click();
  await expect(page.getByText(t('pricing.median'))).toBeVisible();
  await shot('8-median');
});
