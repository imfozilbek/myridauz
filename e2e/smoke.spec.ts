import { loadBrand } from '@platform/brands';
import { expect, test } from '@playwright/test';
import { appUrl, CONTINUE, MINI_APPS } from './apps';
import { mockTelegram, telegramEvents, telegramUrl } from './telegram-mock';

const brand = loadBrand();
const { colors } = brand.theme;

for (const app of MINI_APPS) {
  test(`${app.name}: opens inside Telegram like Telegram itself`, async ({ page }) => {
    const batches: unknown[] = [];
    await page.route('**/api/analytics', async (route) => {
      batches.push(route.request().postDataJSON());
      await route.fulfill({ status: 204 });
    });
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(app.port)));
    await expect(page).toHaveTitle(brand.name);
    await expect(page.getByText(app.welcome(brand.name))).toBeVisible();

    const mainButton = page.locator('#tg-main-button');
    await expect(mainButton).toHaveText(CONTINUE);
    await expect(mainButton).toHaveCSS('background-color', hexToRgb(colors.brandStrong));
    expect(await telegramEvents(page, 'web_app_set_header_color')).toContainEqual({ color: colors.bg });
    expect(await telegramEvents(page, 'web_app_set_bottom_bar_color')).toContainEqual({ color: colors.bg });

    await mainButton.click();
    await expect(page.getByText(app.action)).toBeVisible();
    await expect(mainButton).toBeHidden();

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => batches.length).toBeGreaterThan(0);
    expect(JSON.stringify(batches)).toContain(`"app":"${app.name}"`);
  });
}

function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
