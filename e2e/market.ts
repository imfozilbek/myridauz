import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT } from './apps';

const { t } = createI18n(DEFAULT_LOCALE);

type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;

// The route of a driver from Chilonzor (Toshkent shahri) to Samarqand shahri, or the whole region,
// by lists (G26, docs/74). «Qayerdan» may be filled already by the place of the person: chosen again.
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

// The passenger's search (G35, docs/97 K1): «Qayerdan» opens by itself after «Qayerga» only when
// the place of the person is not known yet; then it is Chilonzor (Toshkent shahri).
export async function fromIfAsked(page: Page) {
  await expect(page.getByText(TEXT.toTitle)).toBeHidden();
  if (!(await page.getByText(TEXT.fromTitle).isVisible())) return;
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
}

// The «Qayerga» list is open at once: Samarqand shahri, then the results of the nearest day.
export async function searchRoute(page: Page) {
  await page.getByAltText('Samarqand viloyati').click();
  await page.getByText('Samarqand shahri', { exact: true }).click();
  await fromIfAsked(page);
}

// A passenger finds trips to Samarqand shahri: the results of the nearest day open at once; the
// filter "ayol bor"; a trip and its «Joy band qilish» on the main button.
export async function findTrips(page: Page, shot: Shot = none) {
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await expect(page.getByText(TEXT.toTitle)).toBeVisible();
  await shot('1-route');
  await searchRoute(page);
  await expect(page.getByText('Jasur', { exact: false })).toBeVisible();
  await shot('2-results');
  await page.getByText(TEXT.womanFilter).first().click();
  await expect(page.getByText('Jasur', { exact: false })).toBeHidden();
  await shot('3-woman');
  await page.getByText('Nodira', { exact: false }).click();
  await expect(page.locator('#tg-main-button', { hasText: TEXT.book })).toBeVisible();
  await shot('4-trip');
}

// A card of the own trips of a driver has no driver on it (docs/83 U6): it opens by the card itself.
export async function openOwnTrip(page: Page) {
  await page.locator('.trip-card').first().click();
}
