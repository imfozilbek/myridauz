import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { openMockupChannels } from './g65-channels-mock';
import { openMockupProfile } from './g65-profile-mock';
import { openMockupWallet } from './g65-wallet-mock';
import { HEIGHT, nothingCut, oneHeight, oneSize, WIDTHS } from './sizes';

const { t } = createI18n(DEFAULT_LOCALE);
const SHOTS = 'screenshots/look';

// docs/121 on narrow and wide phones (G65): «Hamyon», the details of a commission, «Profil» of both
// roles and «Kanallar»; nothing is cut, the tiles, the rows and the pills are of one size each.
for (const width of WIDTHS) {
  test(`${width}px: «Hamyon» and the details of a commission fit`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await openMockupWallet(page, true);
    await nothingCut(page);
    await oneSize(page, '.wallet-card-tile');
    await page.screenshot({ path: `${SHOTS}/g65-wallet-${width}.png`, fullPage: true });
    await page.getByText('Komissiya · Sardor, 2 joy').click();
    await expect(page.getByText(t('wallet.detail.open'))).toBeVisible();
    await nothingCut(page);
    await page.screenshot({ path: `${SHOTS}/g65-commission-${width}.png`, fullPage: true });
  });

  for (const role of ['driver', 'passenger'] as const) {
    test(`${width}px: «Profil» and «Kanallar» of the ${role} fit`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await openMockupProfile(page, role);
      await expect(page.getByText(t('account.profile.stats.onTime'))).toBeVisible();
      await nothingCut(page);
      await oneSize(page, '.profile-stat');
      await oneSize(page, '.profile-row > :first-child');
      await page.screenshot({ path: `${SHOTS}/g65-profile-${role}-${width}.png`, fullPage: true });
    });

    test(`${width}px: «Kanallar» of the ${role} fit`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await openMockupChannels(page, role);
      await nothingCut(page);
      await oneSize(page, '.my-channel-art');
      await oneHeight(page, '.my-channel-pill');
      await page.screenshot({ path: `${SHOTS}/g65-channels-${role}-${width}.png`, fullPage: true });
    });
  }
}
