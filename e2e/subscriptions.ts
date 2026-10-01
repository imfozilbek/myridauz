import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT } from './apps';
import { chooseRoute, chooseWay } from './market';

const { t } = createI18n(DEFAULT_LOCALE);
type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;

// Nothing found: "Xabar bering", any day, done; then "Obunalar" in "Mening safarlarim" (docs/24).
export async function passengerSubscribes(page: Page, shot: Shot = none) {
  await page.getByText(TEXT.findTrip).first().click();
  await chooseWay(page);
  await page.getByText(TEXT.tomorrow).click();
  await expect(page.getByText(t('subscriptions.notify'))).toBeVisible();
  await shot('1-empty');
  await page.getByText(t('subscriptions.notify')).click();
  await expect(page.getByText(t('subscriptions.when.any'))).toBeVisible();
  await shot('2-when');
  await page.getByText(t('subscriptions.when.any')).click();
  await expect(page.getByText(t('subscriptions.done'))).toBeVisible();
  await shot('3-done');
}

export async function passengerList(page: Page, shot: Shot = none) {
  await page.getByText(t('common.myTrips')).click();
  await page.getByText(t('subscriptions.title')).click();
  await expect(page.getByText(t('subscriptions.expired'))).toBeVisible();
  await shot('4-list');
}

// A driver finds no requests and asks to hear about them.
export async function driverSubscribes(page: Page, shot: Shot = none) {
  await page.getByText(TEXT.passengerRequests).click();
  await chooseRoute(page, true);
  await page.getByText(TEXT.tomorrow).click();
  await page.getByText(t('subscriptions.notify')).click();
  await expect(page.getByText(t('subscriptions.when.any'))).toBeVisible();
  await shot('1-when');
}
