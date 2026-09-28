import { loadBrand } from '@platform/brands';
import { expect, test } from '@playwright/test';
import { appUrl, MINI_APPS } from './apps';
import { mockTelegram } from './telegram-mock';

// Screenshots for the owner review (docs/33).
const brand = loadBrand();

for (const app of MINI_APPS) {
  test(`${app.name}: screenshot`, async ({ page }) => {
    await mockTelegram(page);
    await page.goto(appUrl(app.port));
    await expect(page.getByText(app.text(brand.name))).toBeVisible();
    await page.screenshot({ path: `screenshots/miniapp-${app.name}.png` });
  });
}
