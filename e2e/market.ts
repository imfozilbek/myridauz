import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT } from './apps';

const { t } = createI18n(DEFAULT_LOCALE);

type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;

// From Chilonzor (Toshkent shahri) to Samarqand shahri, or the whole Samarqand region, by lists
// (G26, docs/74). «Qayerdan» may be filled already by the place of the person: it is chosen again.
export async function chooseRoute(page: Page, wholeRegion = false) {
  await page.getByText(TEXT.from).click();
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
  await page.getByText(TEXT.to).click();
  await page.getByAltText('Samarqand viloyati').click();
  await page.getByText(wholeRegion ? TEXT.wholeRegion : 'Samarqand shahri', { exact: true }).click();
  await page.locator('#tg-main-button').click();
}

// A driver publishes a trip, one question per screen (G07). The test person is a woman: no woman step.
export async function publishTrip(page: Page, shot: Shot = none) {
  const mainButton = page.locator('#tg-main-button');
  await page.locator('#tg-main-button', { hasText: TEXT.newTrip }).click();
  await chooseRoute(page);
  await shot('2-mode');
  await page.getByText(t('way.trip.mode.both')).click();
  await expect(page.getByText(TEXT.tomorrow)).toBeVisible();
  await shot('2-date');
  await page.getByText(TEXT.tomorrow).click();
  await shot('3-time');
  await mainButton.click();
  await expect(page.getByText(TEXT.tripSeatsTitle)).toBeVisible();
  await shot('4-seats');
  await mainButton.click();
  await expect(page.getByText(TEXT.priceTitle)).toBeVisible();
  await shot('5-price');
  await mainButton.click();
  await expect(page.getByText(TEXT.commentSkip)).toBeVisible();
  await shot('6-comment');
  await page.getByText(TEXT.commentSkip).click();
  await expect(mainButton).toHaveText(TEXT.publish);
  await shot('7-review');
  await mainButton.click();
  await expect(page.getByText(TEXT.published)).toBeVisible();
  await shot('8-published');
}

// A passenger finds trips of tomorrow to Samarqand shahri and filters "ayol bor".
export async function findTrips(page: Page, shot: Shot = none) {
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await expect(page.getByText(TEXT.from)).toBeVisible();
  await shot('1-route');
  await chooseRoute(page);
  await page.getByText(TEXT.tomorrow).click();
  await expect(page.getByText('Jasur', { exact: false })).toBeVisible();
  await shot('2-results');
  await page.getByText(TEXT.womanFilter).first().click();
  await expect(page.getByText('Jasur', { exact: false })).toBeHidden();
  await shot('3-woman');
  await page.getByText('Nodira', { exact: false }).click();
  await expect(page.getByText(TEXT.book)).toBeVisible();
  await shot('4-trip');
}
