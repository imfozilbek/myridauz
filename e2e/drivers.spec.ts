import { expect, test } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { applyAsDriver } from './driver-application';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [, DRIVER, ADMIN] = MINI_APPS;

test('driver: a new driver sends the application and waits for the check', async ({ page }) => {
  const api = await mockApi(page, 'active', 'none');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await applyAsDriver(page);
  expect(api.submitted).toEqual([expect.objectContaining({ plate: '01A123BC', seats: 4 })]);
});

test('admin: the team opens an application and approves it', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(ADMIN.action).click();
  await page.getByText('Jasur').click();
  await page.getByText(TEXT.approve).click();
  await expect(page.getByText(TEXT.decided)).toBeVisible();
});
