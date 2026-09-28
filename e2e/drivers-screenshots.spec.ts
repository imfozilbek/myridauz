import { expect, test } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { applyAsDriver } from './driver-application';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [, DRIVER, ADMIN] = MINI_APPS;

// Screenshots for the owner review (docs/33): the driver application and the team queue (G06).
test('driver application: screenshots', async ({ page }) => {
  await mockApi(page, 'active', 'none');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await applyAsDriver(page, async (name) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `screenshots/driver-apply-${name}.png`, fullPage: true });
  });
});

test('moderation: screenshots', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(ADMIN.action).click();
  await expect(page.getByText('Jasur')).toBeVisible();
  await page.screenshot({ path: 'screenshots/moderation-1-queue.png', fullPage: true });
  await page.getByText('Jasur').click();
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'screenshots/moderation-2-application.png', fullPage: true });
});
