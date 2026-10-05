import { expect, test, type Page } from '../crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { NARGIZA } from './people';
import { openAs, outsideCalls } from './stand-kit';

const { t } = createI18n(DEFAULT_LOCALE);
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/stand/g43/${name}.png`, animations: 'disabled' });

// G43 (docs/111, docs/81 F02, A11): a bad network and an old launch on the whole local Rida.
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test('F02. the network drops: «Internet yoʻq», the error keeps «Orqaga», the network back loads', async ({
  page,
}) => {
  await openAs(page, 'passenger', NARGIZA);
  await expect(page.getByText(t('common.myTrips'))).toBeVisible();
  await page.context().setOffline(true);
  await expect(page.getByText(t('common.offline'))).toBeVisible();
  await page.getByText(t('common.myTrips')).click();
  await expect(page.getByText(t('common.retry'))).toBeVisible();
  await shot(page, '1-offline');
  await page.context().setOffline(false);
  await expect(page.getByText(t('common.offline'))).toBeHidden();
  await page.getByText(t('common.retry')).click();
  await expect(page.getByText(t('common.retry'))).toBeHidden();
  await shot(page, '2-online');
});

test('A11. a launch older than a day asks to open the app again', async ({ page }) => {
  await openAs(page, 'passenger', NARGIZA, { stale: true });
  await expect(page.getByText(t('errors.expired.title'))).toBeVisible();
  await expect(page.getByText(t('errors.expired.description'))).toBeVisible();
  await shot(page, '3-expired');
});
