import { expect, test } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { fromIfAsked } from './market';
import { register } from './registration';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Screenshots for the owner review (docs/33): registration, main screen and profile of each Mini App.
for (const app of MINI_APPS) {
  test(`${app.name}: screenshots`, async ({ page }) => {
    await mockApi(page, app.welcome ? 'unregistered' : 'active');
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(app.port)));
    const shot = (name: string) => page.screenshot({ path: `screenshots/miniapp-${app.name}-${name}.png` });
    if (app.welcome) await register(page, app.welcome, shot);
    await expect(page.getByText(app.action).first()).toBeVisible();
    await shot('6-home');
    if (!app.welcome) return;
    await page.getByText(TEXT.profile).click();
    await expect(page.getByText('Yangi', { exact: true })).toBeVisible();
    await shot('7-profile');
  });
}

test('blocked: screenshot', async ({ page }) => {
  await mockApi(page, 'blocked');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(MINI_APPS[0].port)));
  await expect(page.getByText(TEXT.blocked)).toBeVisible();
  await page.screenshot({ path: 'screenshots/miniapp-blocked.png' });
});

test('places: screenshots', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(MINI_APPS[0].port)));
  // The mouse leaves the screen first: a phone has no hover state.
  const shot = async (name: string) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `screenshots/places-${name}.png`, fullPage: true });
  };
  // The search opens the «Qayerga» list at once (G35, docs/97 K1).
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await expect(page.getByAltText('Xorazm viloyati')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await shot('2-regions');
  const search = page.getByPlaceholder(TEXT.search);
  await search.fill("g'ijduvon");
  await expect(page.getByText('Gʻijduvon')).toBeVisible();
  await shot('4-search');
  await search.fill('');
  await page.getByAltText('Toshkent shahri').click();
  await shot('3-districts');
  await page.getByText('Yunusobod').click();
  await fromIfAsked(page);
  await expect(page.getByText(TEXT.insideCity)).toBeVisible();
  await shot('6-inside-city');
});
