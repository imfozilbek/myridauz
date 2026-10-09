import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openMockupWallet } from './g65-wallet-mock';

// Pixel Perfect of «Hamyon» and «Profil» (G65, lessons 141, 147, 167): the phones of g65/1 … g65/3
// at the size and scale of the mockup (360 × 760 at 1.5) with the data of the mockup; the diff is
// read by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g65';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1.5 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

test('1-wallet-1: ≈ 52 joyga yetadi', async ({ page }) => {
  await openMockupWallet(page);
  await shot(page, '1-wallet-1');
});

test('1-wallet-2: fewer than 5 seats, red', async ({ page }) => {
  await openMockupWallet(page, true);
  await shot(page, '1-wallet-2');
});

test('2-commission-1 and 2: a commission and its details', async ({ page }) => {
  await openMockupWallet(page);
  await shot(page, '2-commission-1');
  await page.getByText('Komissiya · Sardor, 2 joy').click();
  await expect(page.getByText(t('wallet.detail.open'))).toBeVisible();
  await shot(page, '2-commission-2');
});
