import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { mapState, mockMap } from './map-mock';
import { chooseRoute, searchRoute } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The search by lists and the booking with its points (G26, G35, docs/97) on a narrow Android phone
// first: most people in Uzbekistan use one (lesson 52). The flow itself is checked in map.spec.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const TILES_MS = 1500;
const ANDROID = { width: 360, height: 800 };

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/search-android-${name}.png` });
const mainButton = (page: Page) => page.locator('#tg-main-button');
// The map is drawn and the name under the pin came: «Shu yerda» waits for it (lesson 77).
const drawn = async (page: Page) => {
  await expect(page.locator('[data-state="ready"]').first()).toBeVisible();
  await expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'));
  await page.waitForTimeout(TILES_MS);
};

async function open(page: Page, port: number) {
  await page.setViewportSize(ANDROID);
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(port), 'android'));
}

test('passenger: lists, the way, the door in Toshkent, the home, the check', async ({ page }) => {
  await open(page, PASSENGER.port);
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await expect(page.getByText(TEXT.toTitle)).toBeVisible();
  await shot(page, '1-route');
  await searchRoute(page);
  // On Android the native ripple layer lies over the text of a card: the tap goes to the card.
  await page.locator('.trip-card').first().click();
  await mainButton(page).filter({ hasText: TEXT.book }).click();
  await expect(page.getByText(t('way.mode.door'))).toBeVisible();
  await shot(page, '2-way');
  await page.getByText(t('way.mode.door')).click();
  await expect(page.getByText(t('way.point.from'))).toBeVisible();
  await drawn(page);
  await shot(page, '3-door');
  await mainButton(page)
    .filter({ hasText: t('way.point.here') })
    .click();
  await expect(page.getByText(t('way.point.to'))).toBeVisible();
  await drawn(page);
  await page.getByPlaceholder(t('bookings.map.search')).fill('Регистон');
  await page.getByText('Registon maydoni', { exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Registon maydoni yaqinida');
  await page.waitForTimeout(TILES_MS);
  await shot(page, '4-home');
  await mainButton(page)
    .filter({ hasText: t('way.point.here') })
    .click();
  await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
  await shot(page, '5-review');
});

test('driver: the pitak of the direction on the way step', async ({ page }) => {
  await open(page, DRIVER.port);
  await mainButton(page).filter({ hasText: TEXT.newTrip }).click();
  await chooseRoute(page);
  await expect(page.locator('.pitak-map[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '6-driver-way');
});
