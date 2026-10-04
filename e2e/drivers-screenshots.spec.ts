import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { applyAsDriver } from './driver-application';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

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

// What the driver sees when the team asks to fix the face, the front photo and the plate.
test('driver fixes the application: screenshots', async ({ page }) => {
  await mockApi(page, 'active', 'changes');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  const shot = async (name: string) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `screenshots/driver-fix-${name}.png`, fullPage: true });
  };
  await expect(page.getByText(TEXT.reasonPlate)).toBeVisible();
  await shot('1-status');
  await page.locator('#tg-main-button').click();
  await shot('2-review');
  await page.getByText(TEXT.plate, { exact: true }).click();
  await shot('3-plate');
  await pressBack(page);
  await page.getByText(TEXT.photos, { exact: true }).click();
  await expect(page.locator('.photo-frame img')).toHaveCount(3);
  // The face is the first photo of the same screen (G34).
  await expect(page.getByText(TEXT.face, { exact: true })).toBeVisible();
  await shot('4-photos');
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
  await page.locator('#tg-main-button', { hasText: TEXT.approve }).click();
  await expect(page.locator('#tg-main-button')).toHaveText(TEXT.plateMatches);
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'screenshots/moderation-3-plate-check.png', fullPage: true });
  await pressBack(page);
  await page.getByText(TEXT.requestChanges).click();
  await page.getByText(TEXT.reasonFront).click();
  await page.getByText(TEXT.reasonPlate).click();
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'screenshots/moderation-4-reasons.png', fullPage: true });
});
