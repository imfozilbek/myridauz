import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { test } from './crash-guard';
import { fewerSeatsWithWoman, openPublish, pitakOnMap } from './g63-publish-mock';

const { t } = createI18n(DEFAULT_LOCALE);

// Pixel Perfect of G63 (lessons 141, 147, 160): «Safar eʼlon qilish» shot at the size of the mockup
// phones of g63/1-publish.png, g63/2-pitak.png and screens 3, 4 of g63/4-journey-driver.png
// (360 × 760); scripts/pixel-diff.py reads the diff.
const OUT = 'screenshots/pixel-g63';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
const pick = async (page: Page, mode: 'door' | 'both') => {
  await page.getByRole('radio', { name: t(`way.trip.mode.${mode}`) }).click();
  await page.mouse.move(0, 0);
};

test('1-publish: all the seats, then fewer with «Mashinada ayol bor»', async ({ page }) => {
  await openPublish(page);
  await pitakOnMap(page);
  await shot(page, '1-publish-1');
  await fewerSeatsWithWoman(page);
  await shot(page, '1-publish-2');
});

test('2-pitak: Pitakdan, Uydan, Ikkalasi', async ({ page }) => {
  await openPublish(page);
  await fewerSeatsWithWoman(page);
  await pitakOnMap(page);
  await shot(page, '2-pitak-1');
  await pick(page, 'door');
  await shot(page, '2-pitak-2');
  await pick(page, 'both');
  await pitakOnMap(page);
  await shot(page, '2-pitak-3');
});

// Screen 3: «Ikkalasi» with the pitak on the small map; screen 4: «Qanday band qilinadi?» of the
// whole car of 4 seats, as the journey draws it.
test('4-journey: screens 3 and 4', async ({ page }) => {
  await openPublish(page);
  await fewerSeatsWithWoman(page);
  await pick(page, 'both');
  await pitakOnMap(page);
  await shot(page, '4-journey-3');
  await page.getByLabel(t('market.price.more')).first().click();
  await page.getByText(t('market.rule.title')).click();
  await page.mouse.move(0, 0);
  await shot(page, '4-journey-4');
});
