import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { test } from './crash-guard';
import { fewerSeatsWithWoman, openPublish } from './g63-publish-mock';

const { t } = createI18n(DEFAULT_LOCALE);

// Pixel Perfect of G63 (lessons 141, 147, 160): «Safar eʼlon qilish» shot at the size of the mockup
// phones of g63/1-publish.png and g63/2-pitak.png (360 × 760); scripts/pixel-diff.py reads the diff.
const OUT = 'screenshots/pixel-g63';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

test('1-publish: all the seats, then fewer with «Mashinada ayol bor»', async ({ page }) => {
  await openPublish(page);
  await shot(page, '1-publish-1');
  await fewerSeatsWithWoman(page);
  await shot(page, '1-publish-2');
});

test('2-pitak: Pitakdan, Uydan, Ikkalasi', async ({ page }) => {
  await openPublish(page);
  await fewerSeatsWithWoman(page);
  await shot(page, '2-pitak-1');
  await page.getByRole('radio', { name: t('way.trip.mode.door') }).click();
  await page.mouse.move(0, 0);
  await shot(page, '2-pitak-2');
  await page.getByRole('radio', { name: t('way.trip.mode.both') }).click();
  await page.mouse.move(0, 0);
  await shot(page, '2-pitak-3');
});
