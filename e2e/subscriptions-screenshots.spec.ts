import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { driverSubscribes, passengerList, passengerSubscribes } from './subscriptions';
import { LINKED, mockSubscriptions } from './subscriptions-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const shooter = (page: Page, prefix: string) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/${prefix}-${name}.png`, fullPage: true });
};
const open = async (page: Page, url: string) => {
  await mockTelegram(page);
  await page.goto(url);
};

// Screens of G10 for the owner review (docs/33): "Xabar bering", "Obunalar", a trip from a channel.
test('passenger: Xabar bering and Obunalar', async ({ page }) => {
  await mockApi(page, 'active');
  await mockSubscriptions(page, true);
  const shot = shooter(page, 'subscriptions');
  await open(page, telegramUrl(appUrl(PASSENGER.port)));
  await passengerSubscribes(page, shot);
  await page.reload();
  await passengerList(page, shot);
});

test('driver: Xabar bering for requests', async ({ page }) => {
  await mockApi(page, 'active');
  await mockSubscriptions(page, true);
  await open(page, telegramUrl(appUrl(DRIVER.port)));
  await driverSubscribes(page, shooter(page, 'driver-subscriptions'));
});

test('passenger: Band qilish in a channel opens the trip', async ({ page }) => {
  await mockApi(page, 'active');
  await mockSubscriptions(page, false);
  await open(page, `${telegramUrl(appUrl(PASSENGER.port))}&tgWebAppStartParam=trip_${LINKED.id}`);
  await expect(page.getByText(TEXT.book)).toBeVisible();
  await expect(page.getByText('Jasur')).toBeVisible();
  await shooter(page, 'channel')('1-trip');
});

test('passenger: Shu yoʻnalishga obuna in a channel opens the route', async ({ page }) => {
  await mockApi(page, 'active');
  await mockSubscriptions(page, false);
  const day = new Date(Date.now() + 2 * 24 * 3_600_000).toISOString().slice(0, 10);
  await open(page, `${telegramUrl(appUrl(PASSENGER.port))}&tgWebAppStartParam=sub_1726_1718_${day}`);
  await expect(page.getByText(t('subscriptions.when.any'))).toBeVisible();
  await shooter(page, 'channel')('2-subscribe');
});
