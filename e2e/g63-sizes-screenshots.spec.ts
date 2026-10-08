import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { test } from './crash-guard';
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
