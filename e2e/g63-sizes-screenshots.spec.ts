import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { openTripAt } from './g63-pixel-mock';
import { fewerSeatsWithWoman, openPublish } from './g63-publish-mock';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';

const { t } = createI18n(DEFAULT_LOCALE);

// docs/121 on narrow and wide phones (G63): «Safar eʼlon qilish» with all its rows; nothing is cut,
// the icon tiles, the stepper buttons and the chips are of one height each.
for (const width of WIDTHS) {
  test(`${width}px: «Safar eʼlon qilish» fits`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await openPublish(page);
    await fewerSeatsWithWoman(page);
    await nothingCut(page);
    await oneSize(page, '.trip-row > span:first-child');
    await oneSize(page, '.seats-stepper button');
    await page.screenshot({ path: `screenshots/look/g63-publish-${width}.png`, fullPage: true });
    await page.getByRole('radio', { name: t('way.trip.mode.door') }).click();
    await nothingCut(page);
    await page.screenshot({ path: `screenshots/look/g63-publish-door-${width}.png`, fullPage: true });
  });
}

// «Safaringiz kanalda chiqdi» on «Mening safarim» (owner decision 08.10.2026, docs/119): the long
// channel name and the button get smaller on a narrow phone, never cut (docs/121).
const PUBLICITY = {
  channels: [{ username: 'yol_samarqand', title: 'Samarqand viloyati yoʻli', posted: true }],
  views: 3200,
  link: 'https://t.me/test_bot?startapp=trip_7__driver',
};
for (const width of [...WIDTHS, 360])
  test(`${width}px: the trip in the channel fits`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await page.route('**/api/driver/trips/*/publicity', (route) => route.fulfill({ json: PUBLICITY }));
    await openTripAt(page, '2026-10-06T14:20', false);
    const card = page.locator('.own-channel');
    await expect(card.getByText(t('driverTrip.channel.share'))).toBeVisible();
    await nothingCut(page);
    await card.screenshot({ path: `screenshots/look/g63-channel-${width}.png`, animations: 'disabled' });
  });
