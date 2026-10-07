import { expect, test, type Page } from '../crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { NARGIZA } from './people';
import { openAs, outsideCalls } from './stand-kit';

const { t } = createI18n(DEFAULT_LOCALE);
const PLATFORMS = ['android', 'ios'] as const;
type Platform = (typeof PLATFORMS)[number];
const shot = (page: Page, platform: Platform, name: string) =>
  page.screenshot({ path: `screenshots/stand/g43/${platform}-${name}.png`, animations: 'disabled' });

// G43 (docs/111, docs/81 F02, A11): a bad network and an old launch on the whole local Rida.
test.afterEach(() => expect(outsideCalls()).toEqual([]));

for (const platform of PLATFORMS) {
  test(`${platform}, F02. the network drops: «Internet yoʻq», the reason, the network back loads`, async ({
    page,
  }) => {
    await openAs(page, 'passenger', NARGIZA, { platform });
    await expect(page.getByText(t('common.myTrips'))).toBeVisible();
    await page.context().setOffline(true);
    await expect(page.getByText(t('common.offline'))).toBeVisible();
    await page.getByText(t('common.myTrips')).click();
    await expect(page.getByText(t('errors.network'))).toBeVisible();
    await shot(page, platform, '1-offline');
    await page.context().setOffline(false);
    await expect(page.getByText(t('common.offline'))).toBeHidden();
    await page.getByText(t('common.retry')).click();
    await expect(page.getByText(t('common.retry'))).toBeHidden();
    await shot(page, platform, '2-online');
  });

  test(`${platform}, A11. a launch older than a day asks to open the app again`, async ({ page }) => {
    await openAs(page, 'passenger', NARGIZA, { platform, stale: true });
    await expect(page.getByText(t('errors.expired.title'))).toBeVisible();
    await expect(page.getByText(t('errors.expired.description'))).toBeVisible();
    await shot(page, platform, '3-expired');
  });
}
