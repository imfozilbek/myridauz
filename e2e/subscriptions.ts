import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t } = createI18n(DEFAULT_LOCALE);
type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;

// A channel post opens the choice of the day: any day, done; then "Obunalar" in "Mening safarlarim"
// (docs/24). The empty day of a search has only the request (G37, docs/101 R9).
export async function passengerSubscribes(page: Page, shot: Shot = none) {
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
