import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openMockupChannels } from './g65-channels-mock';
import { openMockupProfile } from './g65-profile-mock';
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

// g65/3 has no «Kanallar» row (it comes from docs/119, mockup 7-channels-2): the sheet is laid
// over without it, the row has its own check below.
const withoutChannelsRow = (page: Page) =>
  page.locator('.profile-row', { hasText: t('channels.title') }).evaluate((row) => {
    (row as HTMLElement).style.display = 'none';
  });

for (const [name, role] of [
  ['3-profile-1', 'driver'],
  ['3-profile-2', 'passenger'],
] as const) {
  test(`${name}: «Profil» of the ${role}`, async ({ page }) => {
    await openMockupProfile(page, role);
    await expect(page.getByText(t('account.profile.stats.onTime'))).toBeVisible();
    await withoutChannelsRow(page);
    await shot(page, name);
  });
}

for (const role of ['passenger', 'driver'] as const) {
  test(`4-channels-${role}: «Kanallar» with «Siz uchun»`, async ({ page }) => {
    await openMockupChannels(page, role);
    await expect(page.locator('.my-channel-art').first()).toBeVisible();
    await shot(page, `4-channels-${role}`);
  });
}
