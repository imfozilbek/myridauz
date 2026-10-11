import { expect, test } from '../crash-guard';
import { createModerationClient } from '@platform/api-client';
import { TEXT } from '../apps';
import { addFace, passConsent } from '../registration';
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
const NAME_MS = 15_000;

test('the first visit: «Siz haqingizda» before and after the gender', async ({ page }) => {
  await openHome(page, 'passenger', who(900702, 'Shoira'), 'android');
  await passConsent(page);
  await shot(page, 'android', 'pb01-about');
  await page.getByRole('radio', { name: TEXT.female }).click();
  await addFace(page);
  await expect(mainButton(page)).toHaveText(TEXT.sendPhone);
  await shot(page, 'android', 'pb02-phone');
});

test('the search and the booking up to its review', async ({ page }) => {
  await publishTrip(MUROD, CHILONZOR, SAMARQAND, 'door');
  await register('passenger', SEEKER, 'female');
  await openHome(page, 'passenger', SEEKER, 'android');
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await shot(page, 'android', 'pb10-search');
  await searchTo(page, 'Samarqand shahri');
  await expect(page.locator('.search-trip').filter({ hasText: MUROD.name }).first()).toBeVisible();
  await shot(page, 'android', 'pb15-results');
  await page.locator('.search-trip').filter({ hasText: MUROD.name }).first().click();
  await expect(mainButton(page).filter({ hasText: TEXT.book })).toBeVisible();
  await shot(page, 'android', 'pb16-trip');
  await mainButton(page).filter({ hasText: TEXT.book }).click();
  await page.getByText(t('way.book.pickup')).click();
  await expect(page.getByText(t('way.point.from'))).toBeVisible();
  // The name under the pin is known: the button takes this place, not one still being asked.
  // Four stands side by side answer slowly: the same wait as the other map checks.
  await expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'), { timeout: NAME_MS });
  await shot(page, 'android', 'pb17-pickup');
  await mainButton(page).click();
  await page.getByText(t('way.book.dropoff')).click();
  await expect(page.getByText(t('way.point.to'))).toBeVisible();
  // The name under the pin is known: the button takes this place, not one still being asked.
  await expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'), { timeout: NAME_MS });
  await shot(page, 'android', 'pb18-dropoff');
  await mainButton(page).click();
  await expect(page.getByText(t('bookings.points.all'))).toBeVisible();
  await shot(page, 'android', 'pb19-review');
});

test('an offer opened from the list of the request', async ({ page }) => {
  const asked = await askRide(SEEKER);
  await offerOn(MUROD, asked.id);
  // «Takliflarni koʻrish» of the card of the request, the link the bot sends (G61, G77).
  await openHome(page, 'passenger', SEEKER, 'android', `?request=${asked.id}`);
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
