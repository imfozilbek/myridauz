import { loadBrand } from '@platform/brands';
import { MY_TRIP_LINK, tripEndsAt } from '@platform/contracts';
import type { Page } from '@playwright/test';
import { TEXT } from '../apps';
import { afterSplash, expect, test } from '../crash-guard';
import { answerOffer, askRide, bookingOf, MINUTE, moveTrip, offerOn } from './g27-kit';
import { fillEnds } from './request-kit';
import { mainButton, NARROW, openHome, t } from './screen-tour';
import { searchTo } from './search-kit';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, type Person } from './stand-kit';

// G48 (docs/111) on the whole local Rida with the map of 18.10.2026: names of the map read in Uzbek
// Latin, «Izoh» of a request that reaches the driver (docs/77 P81, P82, docs/78 D81). Each screen is
// shot for the owner (docs/33) into screenshots/stand/g48/.
test.describe.configure({ mode: 'serial' });
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const OUT = 'screenshots/stand/g48';
const NOTE = 'Koʻk darvoza';
const CYRILLIC = /[Ѐ-ӿ]/u;
const SEEKER: Person = { id: 900481, name: 'Gulnora', phone: '998901110481' };
const WRITER: Person = { id: 900482, name: 'Feruza', phone: '998901110482' };
const ASKER: Person = { id: 900483, name: 'Zarina', phone: '998901110483' };
const DRIVER: Person = { id: 900484, name: 'Sardor', phone: '998901110484' };
const MEET_MINUTES = loadBrand().schedule.meetMinutes;
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};

// From the empty day of Yunusobod (the place of the person) to Termiz shahri: «Soʻrov qoldirish».
async function toRequest(page: Page, person: Person) {
  await openHome(page, 'passenger', person, 'android');
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await searchTo(page, 'Termiz shahri');
  // The words are on the hidden button of Telegram too (G79 П10).
  await page.getByText(t('common.passenger.leaveRequest')).locator('visible=true').first().click();
}

test.beforeAll(async () => {
  for (const person of [SEEKER, WRITER, ASKER]) await register('passenger', person, 'female');
  await approvedDriver(DRIVER, '01T484SR');
});

test('P81. a name the map writes in Cyrillic is found by it and read in Uzbek Latin', async ({ page }) => {
  await toRequest(page, SEEKER);
  const start = page.getByText(t('way.point.from'));
  if (!(await start.isVisible())) await page.locator('.points-row').first().click();
  await page.getByPlaceholder(t('way.point.search')).fill('Школа 280');
  const found = page.getByRole('button').filter({ hasText: 'Shkola' });
  await expect(found.first()).toBeVisible();
  for (const line of await found.allInnerTexts()) expect(line).not.toMatch(CYRILLIC);
  await shot(page, '1-search-latin');
});

test('P82. «Izoh» of a request: the same row and sheet as on a booking', async ({ page }) => {
  await toRequest(page, WRITER);
  await fillEnds(page);
  await page
    .locator('.points-row')
    .filter({ hasText: t('bookings.points.note') })
    .click();
  await page.getByPlaceholder(t('market.comment.placeholder')).fill(NOTE);
  await shot(page, '2-request-sheet');
  await mainButton(page)
    .filter({ hasText: t('common.continue') })
    .click();
  await expect(page.locator('.points-row').filter({ hasText: NOTE })).toBeVisible();
  await shot(page, '3-request-note');
  await mainButton(page)
    .filter({ hasText: t('market.request.publish') })
    .click();
  await expect(page.getByText(t('market.request.cancel'))).toBeVisible();
});

test('D81. the driver of the accepted offer sees «Izoh» at the meeting', async ({ page }) => {
  const request = await askRide(ASKER, undefined, NOTE);
  const offer = await offerOn(DRIVER, request.id);
  const { bookingId } = await answerOffer(ASKER, offer.id, 'accept');
  const seat = await bookingOf(ASKER, bookingId ?? '');
  const trip = seat?.trip;
  if (!trip) throw new Error('g48: the seat of the accepted offer is missing');
  const departAt = Date.now() + MEET_MINUTES * MINUTE;
  moveTrip(trip.id, departAt, tripEndsAt(departAt, trip.km));
  await openAs(page, 'driver', DRIVER, { search: `?${MY_TRIP_LINK}=${trip.id}` });
  await page.getByText(t('driverTrip.tile.map')).click();
  await page.locator('.trip-map-stop').first().click();
  await expect(page.getByText(NOTE)).toBeVisible();
  await shot(page, '4-driver-meet');
});
