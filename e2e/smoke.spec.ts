import { loadBrand } from '@platform/brands';
import { expect, test } from '@playwright/test';
import { appUrl, MINI_APPS } from './apps';
import { mockTelegram, telegramCalls } from './telegram-mock';

const brand = loadBrand();

for (const app of MINI_APPS) {
  test(`${app.name}: start screen opens inside Telegram`, async ({ page }) => {
    await mockTelegram(page);
    await page.goto(appUrl(app.port));
    await expect(page).toHaveTitle(brand.name);
    await expect(page.getByText(app.text(brand.name))).toBeVisible();
    expect(await telegramCalls(page)).toEqual(['ready', 'expand']);
  });
}
