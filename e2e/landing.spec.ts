import { expect, test } from '@playwright/test';
import { channelOf, loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { appUrl, LANDING_PORT } from './apps';
import { mockPrices } from './landing-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const brand = loadBrand();

// The landing leads people into the two bots and explains itself (G15, docs/59).
test('landing: the buttons open the bots, the documents open from the footer', async ({ page }) => {
  await page.goto(appUrl(LANDING_PORT));
  await expect(page).toHaveTitle(t('landing.title', { brand: brand.name }));
  const passenger = page.locator('.hero').getByRole('link', { name: t('landing.cta.passenger') });
  await expect(passenger).toHaveAttribute('href', `https://t.me/${brand.bots.passenger}`);
  const driver = page.locator('.hero').getByRole('link', { name: t('landing.cta.driver') });
  await expect(driver).toHaveAttribute('href', `https://t.me/${brand.bots.driver}`);
  await page.getByRole('link', { name: t('legal.privacy.title') }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('legal.privacy.title'));
  await page.getByRole('link', { name: t('landing.document.home') }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('landing.hero.title'));
});

test('landing: the steps, the switch and the map answer a tap', async ({ page }) => {
  await mockPrices(page);
  await page.goto(appUrl(LANDING_PORT));
  await page.getByRole('button', { name: t('landing.pains.after', { brand: brand.name }) }).click();
  await expect(page.getByText(t('landing.pains.wait.after'))).toBeVisible();
  await page.getByRole('tab', { name: t('landing.how.driver') }).click();
  await page.getByRole('button', { name: t('landing.how.driver.3.title') }).click();
  await expect(page.locator('[data-path=driver] .screen.shown')).toHaveAttribute(
    'src',
    '/art/phone-requests.webp',
  );
  await page.getByLabel(t('places.to')).selectOption({ label: 'Buxoro' });
  await expect(page.locator('[data-name=to]')).toHaveText('Buxoro');
  await expect(page.locator('[data-km-value]')).toHaveText('≈ 570 km');
  await expect(page.locator('[data-price]')).toHaveText(/170\s000/u);
  await page.locator('.numbers').scrollIntoViewIfNeeded();
  await expect(page.locator('.numbers [data-count-up]').first()).toHaveText('14');
  await expect(page.locator('output[data-count]')).toHaveText('3');
  const go = page.getByRole('link', { name: t('landing.map.go') });
  await expect(go).toHaveAttribute('href', `https://t.me/${brand.bots.passenger}?startapp=find_1726_1706`);
  await expect(page.locator('[data-channel-link]')).toHaveAttribute(
    'href',
    `https://t.me/${channelOf(brand, '1706401')?.username ?? ''}`,
  );
});

test('landing: a direction page opens from the list with its route chosen', async ({ page }) => {
  await mockPrices(page);
  await page.goto(appUrl(LANDING_PORT));
  await page.locator('.directions').getByRole('link', { name: 'Buxoro' }).first().click();
  await expect(page).toHaveURL(/\/yonalish\/toshkent-buxoro\/$/u);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    t('landing.direction.title', { from: 'Toshkent', to: 'Buxoro' }),
  );
  await expect(page.locator('[data-go]')).toHaveAttribute('href', /startapp=find_1726_1706$/u);
});
