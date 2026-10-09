import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { summary } from './drivers-mock';
import { adminCase, appUrl, MINI_APPS, publishButton, TEXT } from './apps';
import { applyAsDriver } from './driver-application';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [, DRIVER] = MINI_APPS;

test('driver: a new driver sends the application and waits for the check', async ({ page }) => {
  const api = await mockApi(page, 'active', 'none');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await applyAsDriver(page);
  expect(api.submitted).toEqual([expect.objectContaining({ model: 'Damas', plate: '01A123BC', seats: 6 })]);
});

test('driver: the fix opens at once, the retaken photo goes again with «Qayta yuborish» (G62)', async ({
  page,
}) => {
  const api = await mockApi(page, 'active', 'changes');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  const side = page.locator('.photo-tile-problem', { hasText: TEXT.reasonSide });
  await expect(side).toBeVisible();
  await side.click();
  await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
  await expect(page.locator('.photo-tile-problem')).toHaveCount(0);
  await page.locator('#tg-main-button', { hasText: TEXT.resend }).click();
  await expect(page.getByText(TEXT.check)).toBeVisible();
  expect(api.submitted).toEqual([expect.objectContaining({ model: 'Cobalt', plate: '01A123BC' })]);
});

test('driver: approved, «Siz haydovchisiz!» with the bonus, then the main button publishes (G62, G66)', async ({
  page,
}) => {
  await mockApi(page, 'active', 'approved');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await expect(page.getByText(TEXT.approved)).toBeVisible();
  await publishButton(page).click();
  await expect(page.getByText(TEXT.from)).toBeVisible();
});

test('admin: the team opens an application and approves it', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(adminCase(`application=${summary.userId}`)));
  // «Tasdiqlash» is the main button (docs/86 V10).
  await page.locator('#tg-main-button', { hasText: TEXT.approve }).click();
  // The plate is compared with the front photo before approving (docs/50).
  await page.locator('#tg-main-button', { hasText: TEXT.plateMatches }).click();
  await expect(page.getByText(TEXT.decided)).toBeVisible();
});
