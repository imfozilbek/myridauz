import { expect, test, type Page } from '../crash-guard';
import { createBookingsClient } from '@platform/api-client';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT } from '../apps';
import { DILNOZA, DRIVER, MADINA, NODIRA } from './people';
import { searchTo } from './search-kit';
import { outsideCalls, openAs, signedAs, type Person } from './stand-kit';

const { t } = createI18n(DEFAULT_LOCALE);
const PITAK = 'Toshkent avtovokzali';
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/stand/g26/${name}.png`, animations: 'disabled' });
const mainButton = (page: Page) => page.locator('#tg-main-button');
// The small map of the pitak is drawn and its tiles came: a screenshot shows the real map.
async function pitakMapDrawn(page: Page) {
  await expect(page.locator('.pitak-map[data-state="ready"]')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

// The four checks of the owner for G26 (docs/74) on the whole local Rida: a real backend, the real
// directory, the map of Uzbekistan and its search index. The order matters: the trip comes first.
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

// From Chilonzor (Toshkent shahri) to Urgut (Samarqand viloyati), by lists.
async function chooseRoute(page: Page) {
  await page.getByText(TEXT.from).click();
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
  // «Qayerga» opens by itself, both ends go on (G40, docs/106 K1).
  await page.getByAltText('Samarqand viloyati').click();
  await page.getByText('Urgut', { exact: true }).click();
}

test('3. the driver sees the pitak of the direction and publishes «Ikkalasi ham»', async ({ page }) => {
  await openAs(page, 'driver', DRIVER);
  await mainButton(page).filter({ hasText: TEXT.newTrip }).click();
  await chooseRoute(page);
  await expect(page.getByText(t('way.trip.mode.title'))).toBeVisible();
  // The pitak of the direction stands on the small map above the choice.
  await expect(page.getByText(PITAK, { exact: false }).first()).toBeVisible();
  await pitakMapDrawn(page);
  await shot(page, '3-driver-pitak');
  await page.getByText(t('way.trip.mode.both')).click();
  await page.getByText(TEXT.tomorrow).click();
  await mainButton(page).click();
  await expect(page.getByText(TEXT.tripSeatsTitle)).toBeVisible();
  await mainButton(page).click();
  await expect(page.getByText(TEXT.priceTitle)).toBeVisible();
  await mainButton(page).click();
  // «Qanday band qilinadi?» (G61): seats only.
  await page.getByText(t('market.rule.seats')).click();
  await mainButton(page).click();
  await page.getByText(TEXT.commentSkip).click();
  await expect(mainButton(page)).toHaveText(TEXT.publish);
  await shot(page, '3-driver-review');
  await mainButton(page).click();
  await expect(page.getByText(TEXT.published)).toBeVisible();
});

// A passenger finds the trip of tomorrow by lists and asks a seat on it (G35: the seats are in the check).
async function findAndOpen(page: Page, person: Person) {
  await openAs(page, 'passenger', person);
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await searchTo(page, 'Urgut');
  await expect(page.getByText(t('find.mode.both')).first()).toBeVisible();
  await page.locator('.search-trip').first().click();
  await mainButton(page).filter({ hasText: TEXT.book }).click();
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
}

// One end of «Qayerdan, qayerga?»: its row opens the map, the name of the place came (lesson 77).
async function openEnd(page: Page, end: 'pickup' | 'dropoff') {
  await page.getByText(t(end === 'pickup' ? 'way.book.pickup' : 'way.book.dropoff')).click();
  await expect(page.getByText(t(end === 'pickup' ? 'way.point.from' : 'way.point.to'))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  await expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'));
}

test('1. a passenger «from home»: the door in Toshkent, the home in Urgut', async ({ page }) => {
  await findAndOpen(page, NODIRA);
  await openEnd(page, 'pickup');
  await shot(page, '1-pickup-toshkent');
  await mainButton(page).click();
  await openEnd(page, 'dropoff');
  await shot(page, '1-dropoff-urgut');
  await mainButton(page).click();
  await expect(page.getByText(t('bookings.points.all'))).toBeVisible();
  await shot(page, '1-review');
  await mainButton(page).click();
  await expect(page.getByText(t('bookings.status.requested')).first()).toBeVisible();
  await shot(page, '1-sent');
});

test('2. a passenger from the pitak: the pitak is the first start, no point is asked there', async ({
  page,
}) => {
  await findAndOpen(page, MADINA);
  await expect(page.getByText(PITAK, { exact: false }).first()).toBeVisible();
  await openEnd(page, 'dropoff');
  await mainButton(page).click();
  await expect(page.getByText(t('bookings.points.all'))).toBeVisible();
  await expect(page.getByText(PITAK, { exact: false }).first()).toBeVisible();
  await shot(page, '2-review-pitak');
  await mainButton(page).click();
  await expect(page.getByText(t('bookings.status.requested')).first()).toBeVisible();
});

// Every found place lies in the zone: its line ends with a district of the zone.
async function expectOnlyIn(page: Page, query: string, districts: RegExp) {
  await page.getByPlaceholder(t('way.point.search')).fill(query);
  const found = page.getByRole('button').filter({ hasText: query });
  await expect(found.first()).toBeVisible();
  for (const line of await found.allInnerTexts()) expect(line).toMatch(districts);
}

// DILNOZA: she has no seat on the trip yet, the others asked one in 1 and 2 («Bu safarda joyingiz bor»).
test('4. the search of a place finds only inside the zone of the trip', async ({ page }) => {
  await findAndOpen(page, DILNOZA);
  await openEnd(page, 'pickup');
  // «Registon» of Toshkent (a cafe, streets) is found; the Registon square of Samarqand is not.
  await expectOnlyIn(
    page,
    'Registon',
    /(Yakkasaroy|Olmazor|Yunusobod|Chilonzor|Mirobod|Shayxontohur|Uchtepa|Yashnobod|Sergeli|Bektemir|Mirzo Ulugʻbek|Yangihayot)$/u,
  );
  await expect(page.getByText('Registon maydoni')).toHaveCount(0);
  await shot(page, '4-search-toshkent');
  await page.getByPlaceholder(t('way.point.search')).fill('');
  await mainButton(page).click();
  await openEnd(page, 'dropoff');
  // At the end of the trip «bozor» finds the markets of Urgut only, none of the many in Toshkent.
  await expectOnlyIn(page, 'bozor', /Urgut$/u);
  await shot(page, '4-search-urgut');
});

// The server checks the points itself (G26, item 10): a door in Samarqand on a trip from Toshkent.
test('5. the server refuses a point outside the zone of the trip', async () => {
  const [booked] = await createBookingsClient(await signedAs('passenger', NODIRA)).myBookings();
  if (!booked) throw new Error('stand: scenario 1 made no booking');
  const bookings = createBookingsClient(await signedAs('passenger', DILNOZA));
  const registon = { lat: 39.6548, lng: 66.9757 };
  const home = { lat: 39.4092, lng: 67.2494 };
  const outside = bookings.book(booked.trip.id, { seats: 1, mode: 'door', pickup: registon, dropoff: home });
  await expect(outside).rejects.toThrow('bookings.outside_area');
});
