import { expect, test } from '../crash-guard';
import { createModerationClient } from '@platform/api-client';
import { TEXT } from '../apps';
import { CHILONZOR, publishTrip } from './market-kit';
import { askRide, offerOn, SAMARQAND } from './g27-kit';
import { MUROD, OWNER } from './people';
import { mainButton, NARROW, openHome, shot, t } from './screen-tour';
import { register } from './seed';
import { searchTo } from './search-kit';
import { signedAs, type Person } from './stand-kit';
import { standRows } from './stand-tools';

// The flows of a passenger screen by screen (docs/83): the first visit to the end, the search and
// the booking up to its review, an offer opened from the list, the screen of a blocked person.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
const who = (id: number, name: string): Person => ({ id, name, phone: `99890111${id - 900000}` });
const SEEKER = who(900701, 'Oydin');

test('the first visit: «Siz haqingizda» before and after the gender', async ({ page }) => {
  await openHome(page, 'passenger', who(900702, 'Shoira'), 'android');
  await mainButton(page).click();
  await expect(page.getByText(TEXT.about)).toBeVisible();
  await shot(page, 'android', 'pb01-about');
  await page.getByRole('button', { name: TEXT.female }).click();
  await expect(mainButton(page)).toHaveText(TEXT.sendPhone);
  await shot(page, 'android', 'pb02-phone');
});

test('the search and the booking up to its review', async ({ page }) => {
  await publishTrip(MUROD, CHILONZOR, SAMARQAND, 'door');
  await register('passenger', SEEKER, 'female');
  await openHome(page, 'passenger', SEEKER, 'android');
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await shot(page, 'android', 'pb10-search');
  await searchTo(page, 'Samarqand viloyati', 'Samarqand shahri');
  await expect(page.locator('.trip-card').filter({ hasText: MUROD.name }).first()).toBeVisible();
  await shot(page, 'android', 'pb15-results');
  await page.locator('.trip-card').filter({ hasText: MUROD.name }).first().click();
  await mainButton(page).filter({ hasText: TEXT.book }).click();
  await expect(page.getByText(t('way.point.from'))).toBeVisible();
  await shot(page, 'android', 'pb17-pickup');
  await mainButton(page).click();
  await expect(page.getByText(t('way.point.to'))).toBeVisible();
  await shot(page, 'android', 'pb18-dropoff');
  await mainButton(page).click();
  await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
  await shot(page, 'android', 'pb19-review');
});

test('an offer opened from the list of the request', async ({ page }) => {
  const offer = await offerOn(MUROD, (await askRide(SEEKER)).id);
  await openHome(page, 'passenger', SEEKER, 'android', `?offer=${offer.id}`);
  await page.getByText(MUROD.name).first().click();
  await shot(page, 'android', 'pb20-offer');
});

test('a blocked person sees why and until when', async ({ page }) => {
  const blocked = who(900703, 'Dildora');
  await register('passenger', blocked, 'female');
  const [row] = standRows(`SELECT public_id FROM users WHERE id = ${blocked.id}`);
  await createModerationClient(await signedAs('admin', OWNER)).block(String(row?.['public_id']), 7);
  await openHome(page, 'passenger', blocked, 'android');
  await expect(page.getByText(TEXT.blocked)).toBeVisible();
  await expect(mainButton(page)).toHaveText(t('account.support'));
  await shot(page, 'android', 'pb30-blocked');
});
