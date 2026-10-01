import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { mapState, mockMap } from './map-mock';
import { chooseRoute } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The search by lists and the booking with its points (G26, docs/74) on a narrow Android phone
// first: most people in Uzbekistan use one (lesson 52). The flow itself is checked in map.spec.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const TILES_MS = 1500;
const ANDROID = { width: 360, height: 800 };

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/search-android-${name}.png` });
const mainButton = (page: Page) => page.locator('#tg-main-button');
const drawn = async (page: Page) => {
  await expect(page.locator('[data-state="ready"]').first()).toBeVisible();
  await page.waitForTimeout(TILES_MS);
};

async function open(page: Page, port: number) {
  await page.setViewportSize(ANDROID);
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(port), 'android'));
}

test('passenger: lists, seats, the door in Toshkent, the home, the check', async ({ page }) => {
  await open(page, PASSENGER.port);
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await expect(page.getByText(TEXT.from)).toBeVisible();
  await shot(page, '1-route');
  await chooseRoute(page);
  await page.getByText(TEXT.tomorrow).click();
  // On Android the native ripple layer lies over the text of a card: the tap goes to the card.
  await page.locator('.trip-card').first().click();
  await page.getByText(TEXT.book).click();
  await page.getByText(t('market.request.seats', { count: '1' })).click();
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
