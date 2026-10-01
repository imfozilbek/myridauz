import { expect, test, type Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { findTrips, publishTrip } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [PASSENGER, DRIVER, ADMIN] = MINI_APPS;
const shooter = (page: Page, prefix: string) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/${prefix}-${name}.png`, fullPage: true });
};

// Screenshots for the owner review (docs/33): trips, search, prices (G07).
test('driver: main screen and a new trip', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  const shot = shooter(page, 'trip-new');
  await expect(page.getByText(TEXT.newTrip)).toBeVisible();
  await shot('1-home');
  await publishTrip(page, shot);
});

test('passenger: main screen and the search', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  const shot = shooter(page, 'trip-search');
  await expect(page.getByText(TEXT.findTrip).first()).toBeVisible();
  await shot('1-home');
  await findTrips(page, shot);
});

test('admin: main screen and prices', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  const shot = shooter(page, 'pricing');
  await expect(page.getByText(TEXT.management)).toBeVisible();
  await shot('1-home');
  await page.getByText(TEXT.management).click();
  await shot('2-management');
  await page.getByText(TEXT.pricing, { exact: true }).click();
  await expect(page.getByText(TEXT.editFormula)).toBeVisible();
  await shot('3-prices');
  await page.getByText(TEXT.editFormula).click();
  await page.getByRole('spinbutton').first().fill('320');
  await shot('4-edit');
  await page.locator('#tg-main-button').click();
  await expect(page.getByText('→').first()).toBeVisible();
  await shot('5-preview');
});

test('driver: looks around while the application is checked', async ({ page }) => {
  await mockApi(page, 'active', 'pending');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  const shot = shooter(page, 'driver-pending');
  await expect(page.getByText(TEXT.pending)).toBeVisible();
  await shot('1-home');
  await page.getByText(TEXT.passengerRequests, { exact: true }).click();
  await expect(page.getByText(TEXT.pendingRequests)).toBeVisible();
  await shot('2-requests');
});

test('admin: the trips of the team', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  const shot = shooter(page, 'team-trips');
  await page.getByText(TEXT.management).click();
  await page.getByText(TEXT.teamTrips, { exact: true }).click();
  await expect(page.getByText('Bekzod')).toBeVisible();
  await shot('1-list');
  await page.getByText('Jasur').click();
  await shot('2-trip');
});
