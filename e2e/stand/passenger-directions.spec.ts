import { DIRECTION_CARDS } from '@platform/contracts';
import { expect, test, type Page } from '../crash-guard';
import { TEXT } from '../apps';
import { mainButton, NARROW, openHome, shot, t } from './screen-tour';
import { register } from './seed';
import { outsideCalls, type Person } from './stand-kit';

// «Qayerga borasiz?» on the real server (G59, lesson 149): every card of a whole region has its price
// even with no trip, and a tap opens «Safarlar» of that region, never the error screen.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const SEEKER: Person = { id: 900863, name: 'Mohira', phone: '998901110863' };
const ASKER: Person = { id: 900864, name: 'Sevara', phone: '998901110864' };

test.beforeAll(async () => {
  await register('passenger', SEEKER, 'female');
  await register('passenger', ASKER, 'female');
});

async function openLastCard(page: Page, person: Person) {
  await openHome(page, 'passenger', person, 'android');
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  const asked = page.getByText(t('places.fromTitle'));
  await expect(asked.or(page.getByText(t('find.title')))).toBeVisible();
  if (await asked.isVisible()) {
    // Toshkent shahri is taken whole in one tap (G78 П9).
    await page.getByAltText('Toshkent shahri').click();
  }
  const cards = page.locator('.direction-card');
  await expect(cards).toHaveCount(DIRECTION_CARDS);
  return cards;
}

test('a card of a region: its price, then its trips', async ({ page }) => {
  const cards = await openLastCard(page, SEEKER);
  await shot(page, 'android', 'directions');
  await cards.last().click();
  await expect(page.locator('.week-row')).toBeVisible();
  await expect(page.getByText(t('common.retry'))).toHaveCount(0);
  await shot(page, 'android', 'directions-results');
});

// A request to the whole region of a card gets its price (G52, docs/112): the price of a whole region
// was refused (locations.not_found) and the request went back to «Qayerdan, qayerga?».
test('a request to the whole region of a card', async ({ page }) => {
  const cards = await openLastCard(page, ASKER);
  await cards.last().click();
  await expect(page.locator('.week-row')).toBeVisible();
  // The last day of the week: no scenario of the stand puts a trip there (lesson 95), so the day is
  // empty and its row offers the request.
  await page.locator('.week-day').last().click();
  await page.locator('#root').getByText(t('common.passenger.leaveRequest')).first().click();
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  await shot(page, 'android', 'directions-request');
});
