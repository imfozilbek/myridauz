import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { summary } from './drivers-mock';
import { adminCase, appUrl, MINI_APPS, openFindTrip, TEXT } from './apps';
import { searchRoute } from './market';
import { tripOf } from './market-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const shot = async (page: Page, name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/g29-${name}.png`, fullPage: true });
};

// New screens of G29 for the owner review (docs/33, docs/89).
test('passenger: a search emptied by a filter says so (P6)', async ({ page }) => {
  await mockApi(page, 'active');
  // The only trip of the day has no woman on board: «Mashinada ayol bor» hides it.
  await page.route('**/api/trips?*', (route) => {
    const woman = new URL(route.request().url()).searchParams.get('woman') === '1';
    return route.fulfill({ json: { trips: woman ? [] : [tripOf('1', 'Jasur', false, 26)] } });
  });
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await openFindTrip(page);
  await searchRoute(page);
  await expect(page.getByText('Jasur', { exact: false })).toBeVisible();
  await page.getByText(TEXT.womanFilter).first().click();
  await expect(page.getByText(t('market.search.clearFilters'))).toBeVisible();
  await shot(page, 'p6-filtered');
});

test('moderation: a photo on the whole screen (S8)', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(adminCase(`application=${summary.userId}`)));
  await page.getByRole('button', { name: t('drivers.photo.front') }).click();
  await expect(page.getByText(t('drivers.photo.front'))).toBeVisible();
  await shot(page, 's8-photo');
  await pressBack(page);
  await expect(page.getByText(TEXT.approve)).toBeVisible();
});
