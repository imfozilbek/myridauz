import { expect, test } from './crash-guard';
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
  expect(api.submitted).toEqual([expect.objectContaining({ model: 'Damas', plate: '01A123BC', seats: 6 })]);
});

test('admin: the team opens an application and approves it', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(ADMIN.action).click();
  await page.getByText('Jasur').click();
  // «Tasdiqlash» is the main button (docs/86 V10).
  await page.locator('#tg-main-button', { hasText: TEXT.approve }).click();
  // The plate is compared with the front photo before approving (docs/50).
  await page.locator('#tg-main-button', { hasText: TEXT.plateMatches }).click();
  await expect(page.getByText(TEXT.decided)).toBeVisible();
});
