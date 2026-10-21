import { createComfortClient, createFeedbackClient } from '@platform/api-client';
import type { Page } from '@playwright/test';
import { afterSplash, expect, test } from '../crash-guard';
import { confirmedSeat, MINUTE, moveTrip } from './g27-kit';
import { OWNER } from './people';
import { NARROW, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { runCron } from './stand-tools';

// G91 (docs/217, docs/218) on the whole local Rida: the new looks of the screens, each shot for the
// owner (docs/33) into screenshots/stand/g91/.
test.describe.configure({ mode: 'serial' });
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const OUT = 'screenshots/stand/g91';
const DRIVER: Person = { id: 900911, name: 'Sardor', phone: '998901110911' };
const LOLA: Person = { id: 900912, name: 'Lola', phone: '998901110912' };
const ZARINA: Person = { id: 900913, name: 'Zarina', phone: '998901110913' };
const KAMOL: Person = { id: 900914, name: 'Kamol', phone: '998901110914' };
const NIGORA: Person = { id: 900915, name: 'Nigora', phone: '998901110915' };
const HOUR = 60 * MINUTE;
// A trip nobody has: its link is old (texts 1, docs/218).
const GONE = '00000000-0000-4000-8000-000000000000';
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};
let tripId = '';
let driverId = '';

test.beforeAll(async () => {
  await approvedDriver(DRIVER, '01T911SR');
  await register('passenger', LOLA, 'female');
  const { trip } = await confirmedSeat(DRIVER, LOLA);
  tripId = trip.id;
  driverId = trip.driver.id;
});

test('PAS-9. the trip of the own seat opens the seat', async ({ page }) => {
  await openAs(page, 'passenger', LOLA, { start: `trip_${tripId}` });
  await expect(page.getByText(t('market.trip.openSeat'))).toBeVisible();
  await shot(page, '1-trip-own-seat');
});

test('Text 1. an old link of a trip that is gone says so', async ({ page }) => {
  await openAs(page, 'passenger', LOLA, { start: `trip_${GONE}` });
  await expect(page.getByText(t('errors.trips.not_found'))).toBeVisible();
  await shot(page, '2-trip-gone');
});

test('PAS-4. a saved driver opens the sheet that takes him out', async ({ page }) => {
  await createComfortClient(await signedAs('passenger', LOLA)).save(driverId);
  await openAs(page, 'passenger', LOLA);
  await page.getByText(t('comfort.favorites.title'), { exact: true }).click();
  await page.getByText(DRIVER.name).first().click();
  await expect(page.getByText(t('comfort.favorites.remove'))).toBeVisible();
  await shot(page, '3-favorite-sheet');
});

test('Text 8. no saved driver yet: how to get one', async ({ page }) => {
  await register('passenger', NIGORA, 'female');
  await openAs(page, 'passenger', NIGORA);
  await page.getByText(t('comfort.favorites.title'), { exact: true }).click();
  await expect(page.getByText(t('comfort.favorites.emptyHint'))).toBeVisible();
  await shot(page, '4-favorites-empty');
});

test('WALK-4. ⇅ is off while both ends are empty', async ({ page }) => {
  await openAs(page, 'passenger', NIGORA);
  const clear = page.getByRole('button', { name: t('home.dock.clear') });
  while ((await clear.count()) > 0) await clear.first().click();
  await expect(page.getByRole('button', { name: t('home.dock.swap') })).toBeDisabled();
  await shot(page, '5-swap-off');
});

test('ADM-7. a complaint decided already: its state and «Davom etish»', async ({ page }) => {
  await approvedDriver(KAMOL, '01T914KM');
  await register('passenger', ZARINA, 'female');
  const { trip, seat } = await confirmedSeat(KAMOL, ZARINA);
  moveTrip(trip.id, Date.now() - 6 * HOUR, Date.now() - HOUR);
  await runCron();
  await createFeedbackClient(await signedAs('passenger', ZARINA)).complain({
    bookingId: seat.id,
    reasons: ['price_changed'],
  });
  const team = createFeedbackClient(await signedAs('admin', OWNER));
  const complaint = (await team.queue()).find((one) => one.tripId === trip.id);
  await team.decide(complaint?.id ?? '', { action: 'warning' });
  await openAs(page, 'admin', OWNER, { search: `?complaint=${complaint?.id ?? ''}` });
  await expect(page.getByText(t('manage.complaintStatus.resolved'))).toBeVisible();
  await shot(page, '6-complaint-resolved');
});
