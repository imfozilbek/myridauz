import { brandForApp, loadBrand } from '@platform/brands';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { fromIfAsked } from './market';
import { register } from './registration';
import { mockTelegram, telegramEvents, telegramUrl } from './telegram-mock';

const brand = loadBrand();

for (const app of MINI_APPS) {
  test(`${app.name}: opens inside Telegram like Telegram itself`, async ({ page }) => {
    // Each Mini App has its own main color (docs/20).
    const { colors } = brandForApp(brand, app.name).theme;
    const api = await mockApi(page, app.welcome ? 'unregistered' : 'active');
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(app.port)));
    await expect(page).toHaveTitle(brand.name);
    const mainButton = page.locator('#tg-main-button');
    if (app.welcome) {
      await expect(page.getByText(app.welcome)).toBeVisible();
      await expect(mainButton).toHaveText(TEXT.continue);
      await expect(mainButton).toHaveCSS('background-color', hexToRgb(colors.brandStrong));
      await register(page, app.welcome);
      await expect(page.getByText(TEXT.profile)).toBeVisible();
      expect(api.registrations).toEqual([
        expect.objectContaining({ consent: true, firstName: 'Dilnoza', gender: 'female' }),
      ]);
      expect(await telegramEvents(page, 'web_app_request_write_access')).toHaveLength(1);
    }
    expect(await telegramEvents(page, 'web_app_set_header_color')).toContainEqual({ color: colors.bg });
    expect(await telegramEvents(page, 'web_app_set_bottom_bar_color')).toContainEqual({ color: colors.bg });
    await expect(page.getByText(app.action).first()).toBeVisible();
    if (app.mainButton) await expect(mainButton).toHaveText(app.mainButton);
    else await expect(mainButton).toBeHidden();

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => api.analytics.length).toBeGreaterThan(0);
    expect(JSON.stringify(api.analytics)).toContain(`"app":"${app.name}"`);
  });
}

test('a blocked person sees only the block', async ({ page }) => {
  await mockApi(page, 'blocked');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(MINI_APPS[0].port)));
  await expect(page.getByText(TEXT.blocked)).toBeVisible();
});

function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

test('route: a place is chosen by region photo, search, and a trip inside the city is refused', async ({
  page,
}) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(MINI_APPS[0].port)));
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  // «Qayerga» opens at once (G35); «Qayerdan» opens by itself when the place of the person is unknown.
  await page.getByPlaceholder(TEXT.search).fill('yunus');
  await page.getByText('Yunusobod').click();
  await fromIfAsked(page);
  await expect(page.getByText(TEXT.insideCity)).toBeVisible();
  await page.getByText(TEXT.to).click();
  await page.getByPlaceholder(TEXT.search).fill("farg'ona sh");
  await page.getByText('Fargʻona shahri').click();
  await expect(page.getByText(TEXT.insideCity)).toBeHidden();
  await expect(page.getByText(TEXT.otherDay)).toBeVisible();
});
