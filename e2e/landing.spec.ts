import { expect, test } from '@playwright/test';
import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { appUrl, LANDING_PORT } from './apps';

const { t } = createI18n(DEFAULT_LOCALE);
const brand = loadBrand();

// The landing leads people into the two bots and shows the documents (G15, docs/59).
test('landing: the buttons open the bots, the documents open from the footer', async ({ page }) => {
  await page.goto(appUrl(LANDING_PORT));
  await expect(page).toHaveTitle(t('landing.title', { brand: brand.name }));
  const passenger = page.getByRole('link', { name: t('landing.cta.passenger') }).first();
  await expect(passenger).toHaveAttribute('href', `https://t.me/${brand.bots.passenger}`);
  const driver = page.getByRole('link', { name: t('landing.cta.driver') }).first();
  await expect(driver).toHaveAttribute('href', `https://t.me/${brand.bots.driver}`);
  await page.getByRole('link', { name: t('legal.privacy.title') }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('legal.privacy.title'));
  await page.getByRole('link', { name: t('landing.document.home') }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('landing.hero.title'));
});
