import { DIRECTION_CARDS } from '@platform/contracts';
import { expect, test } from '../crash-guard';
import { TEXT } from '../apps';
import { mainButton, NARROW, openHome, shot, t } from './screen-tour';
import { register } from './seed';
import { outsideCalls, type Person } from './stand-kit';

// «Qayerga borasiz?» on the real server (G59, lesson 149): every card of a whole region has its price
// even with no trip, and a tap opens «Safarlar» of that region, never the error screen.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const SEEKER: Person = { id: 900795, name: 'Mohira', phone: '998901110795' };

test.beforeAll(() => register('passenger', SEEKER, 'female'));

test('a card of a region: its price, then its trips', async ({ page }) => {
  await openHome(page, 'passenger', SEEKER, 'android');
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  const asked = page.getByText(t('places.fromTitle'));
  await expect(asked.or(page.getByText(t('find.title')))).toBeVisible();
  if (await asked.isVisible()) {
    await page.getByAltText('Toshkent shahri').click();
    await page.getByText('Chilonzor').click();
  }
  const cards = page.locator('.direction-card');
  await expect(cards).toHaveCount(DIRECTION_CARDS);
  await shot(page, 'android', 'directions');
  await cards.last().click();
  await expect(page.locator('.day-counts')).toBeVisible();
  await expect(page.getByText(t('common.retry'))).toHaveCount(0);
  await shot(page, 'android', 'directions-results');
});
