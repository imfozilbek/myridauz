import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { passengerList, passengerSubscribes } from './subscriptions';
import { LINKED, mockSubscriptions } from './subscriptions-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const shooter = (page: Page, prefix: string) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/${prefix}-${name}.png`, fullPage: true });
};
const day = (ahead: number) => new Date(Date.now() + ahead * 24 * 3_600_000).toISOString().slice(0, 10);
const open = async (page: Page, url: string) => {
  await mockTelegram(page);
  await page.goto(url);
};

// Screens of G10 for the owner review (docs/33): "Xabar bering", "Obunalar", a trip from a channel.
test('passenger: Xabar bering and Obunalar', async ({ page }) => {
  await mockApi(page, 'active');
  await mockSubscriptions(page);
  const shot = shooter(page, 'subscriptions');
  await open(page, `${telegramUrl(appUrl(PASSENGER.port))}&tgWebAppStartParam=sub_1726_1730_${day(2)}`);
  await passengerSubscribes(page, shot);
  // Only the hash of the address changes: the page loads again by itself only after a reload.
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.reload();
  await passengerList(page, shot);
});

test('passenger: Band qilish in a channel opens the trip', async ({ page }) => {
  await mockApi(page, 'active');
  await mockSubscriptions(page);
  await open(page, `${telegramUrl(appUrl(PASSENGER.port))}&tgWebAppStartParam=trip_${LINKED.id}`);
  await expect(page.getByText(TEXT.book)).toBeVisible();
  await expect(page.getByText('Jasur')).toBeVisible();
  await shooter(page, 'channel')('1-trip');
});

test('passenger: Shu yoʻnalishga obuna in a channel opens the route', async ({ page }) => {
  await mockApi(page, 'active');
  await mockSubscriptions(page);
  await open(page, `${telegramUrl(appUrl(PASSENGER.port))}&tgWebAppStartParam=sub_1726_1718_${day(2)}`);
  await expect(page.getByText(t('subscriptions.when.any'))).toBeVisible();
  await shooter(page, 'channel')('2-subscribe');
});
