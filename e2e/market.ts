import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT, newTripTile } from './apps';

const { t } = createI18n(DEFAULT_LOCALE);

type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;

// The route of a driver from Chilonzor (Toshkent shahri) to Samarqand shahri, or the whole region,
// by lists (G26, docs/74). «Qayerdan» may be filled already by the place of the person: chosen again.
// «Qayerga» opens by itself, both ends go on without «Davom etish» (G40, docs/106 K1).
export async function chooseRoute(page: Page, wholeRegion = false) {
  await page.getByText(TEXT.from).click();
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
  await page.getByAltText('Samarqand viloyati').click();
  await page.getByText(wholeRegion ? TEXT.wholeRegion : 'Samarqand shahri', { exact: true }).click();
}

// A driver publishes a trip on one screen (G63, docs/118 path 6): the route by lists, then «Safar
// eʼlon qilish» with every answer ready; the rule of the whole car opens its own screen and comes
// back (G61). «Eʼlon qilish» opens «Mening safarim» of the new trip at once.
export async function publishTrip(page: Page, shot: Shot = none) {
  const mainButton = page.locator('#tg-main-button');
  await newTripTile(page).click();
  await chooseRoute(page);
  await expect(mainButton).toHaveText(TEXT.publish);
  await shot('2-publish');
  await page.getByText(t('market.rule.title')).click();
  await page.getByText(t('market.rule.seatsOrCar')).click();
  await shot('3-rule');
  await mainButton.click();
  await expect(mainButton).toHaveText(TEXT.publish);
  await mainButton.click();
  await expect(page.getByText(TEXT.tripOpened)).toBeVisible();
  await shot('4-published');
}

// The passenger's search (G59, docs/118 path 2): «Qayerdan» is asked only when the place of the person
// is unknown, then Chilonzor (Toshkent shahri); «Qayerga borasiz?» comes after it.
export async function fromIfAsked(page: Page) {
  const asked = page.getByText(TEXT.fromTitle);
  await expect(asked.or(page.getByText(TEXT.directions))).toBeVisible();
  if (!(await asked.isVisible())) return;
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
}

// Samarqand shahri by «Boshqa joy: tuman yoki shahar», then the trips of the nearest day with trips.
export async function searchRoute(page: Page) {
  await fromIfAsked(page);
  await page.getByText(TEXT.otherPlace).click();
  await page.getByPlaceholder(TEXT.otherPlace).fill('Samar');
  await page.getByText('Samarqand shahri', { exact: true }).click();
}

// A passenger finds trips to Samarqand shahri: «Qayerga borasiz?», the trips of the nearest day; the
// filter "ayol bor"; «Safar» of a trip and its «1 ta joy band qilish» on the main button.
export async function findTrips(page: Page, shot: Shot = none) {
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await fromIfAsked(page);
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

// A trip of «Mening safarlarim» of a driver (G64, mockup g64/6): a live one from its row, an over
// one from «Oʻtgan».
export async function openOwnTrip(page: Page) {
  const live = page.locator('.driver-trip');
  await page.locator('.market-tabs').waitFor();
  if ((await live.count()) === 0) await page.getByText(t('bookings.tab.past')).click();
  await page.locator('.driver-trip, .trip-card').first().click();
}
