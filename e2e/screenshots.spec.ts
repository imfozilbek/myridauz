import { loadBrand } from '@platform/brands';
import { expect, test } from '@playwright/test';
import { appUrl, CONTINUE, MINI_APPS } from './apps';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Screenshots for the owner review (docs/33): welcome and main screen of each Mini App.
const brand = loadBrand();

for (const app of MINI_APPS) {
  test(`${app.name}: screenshots`, async ({ page }) => {
    await page.route('**/api/analytics', (route) => route.fulfill({ status: 204 }));
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(app.port)));
    await expect(page.getByText(app.welcome(brand.name))).toBeVisible();
    await page.screenshot({ path: `screenshots/miniapp-${app.name}-1-welcome.png` });
    await page.getByRole('button', { name: CONTINUE }).click();
    await expect(page.getByText(app.action)).toBeVisible();
    await page.screenshot({ path: `screenshots/miniapp-${app.name}-2-home.png` });
  });
}
