import { expect, test } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
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
    await expect(page.getByText(app.action)).toBeVisible();
    await shot('6-home');
    if (!app.welcome) return;
    await page.getByText(TEXT.profile).click();
    await expect(page.getByText('Yangi')).toBeVisible();
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
