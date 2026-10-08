import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openBoard, type Board } from './g64-requests-mock';

// Pixel Perfect of «Yoʻlovchilar soʻrovlari» (G64, lessons 141, 147, 167): the phones of g64/1 …
// g64/3 at the size and scale of the mockup (360 × 760 at 1.5) with the data of the mockup; the diff
// is read by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g64';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1.5 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

// A sheet opens from a card by its action; the time of the mockup is chosen on it.
const sheet = async (page: Page, who: string, action: string, time: string) => {
  await page.locator('.request-row', { hasText: who }).getByText(action).click();
  await page.getByRole('dialog').getByRole('radio', { name: time }).click();
  await expect(page.getByRole('dialog').getByRole('radio', { name: time })).toHaveAttribute(
    'aria-checked',
    'true',
  );
};

const SCREENS: readonly (readonly [string, Board])[] = [
  ['1-requests-1', 'today'],
  ['1-requests-2', 'trip'],
  ['3-salon-1', 'salon'],
];

for (const [name, board] of SCREENS)
  test(`${name}: the board`, async ({ page }) => {
    await openBoard(page, board);
    await shot(page, name);
  });

test('1-requests-3: «Taklif yuborish» for Nilufar', async ({ page }) => {
  await openBoard(page, 'nilufar');
  await sheet(page, 'Nilufar', t('bookings.offer.send'), '16:00');
  await shot(page, '1-requests-3');
});

test('3-salon-2: «Sardor uchun safar»', async ({ page }) => {
  await openBoard(page, 'salon');
  await sheet(page, 'Sardor', t('requests.action.salon'), '08:00');
  await shot(page, '3-salon-2');
});
