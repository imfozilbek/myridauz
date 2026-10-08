import { expect, type Page } from '@playwright/test';
import { test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import type { DriverStart } from './drivers-mock';
import { fillCar } from './driver-application';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

// Pixel Perfect of G62 (lessons 141, 147, docs/138): the driver application shot at the size of the
// mockup phones of g62/1-path.png (360 × 760); the diff is read by scripts/pixel-diff.py.
const OUT = 'screenshots/pixel-g62';
const [, DRIVER] = MINI_APPS;
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

async function open(page: Page, start: DriverStart) {
  await mockApi(page, 'active', start);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
}

test('1, 2, 3: the home before the application, «Mashinangiz» and «Mashina rasmlari»', async ({ page }) => {
  await open(page, 'none');
  await expect(page.getByText(TEXT.becomeDriver)).toBeVisible();
  await shot(page, '01');
  await fillCar(page);
  await page.getByRole('button', { name: 'Cobalt', exact: true }).click();
  await shot(page, '02');
  await page.locator('#tg-main-button').click();
  // The front by its tile, then the camera opens by itself for the side (G40, K7).
  await page.locator('.photo-tile', { hasText: TEXT.photoFront }).click();
  for (const label of [TEXT.photoFront, TEXT.photoSide]) {
    await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
    await expect(page.locator('.photo-tile', { hasText: label })).toHaveAttribute('data-taken', 'true');
  }
  // The camera opened by itself for the inside: «Назад» closes it, the tile stays empty.
  await page.getByRole('dialog').getByLabel(TEXT.shutter).waitFor();
  await pressBack(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await shot(page, '03');
});

const STATES = [
  ['04', 'pending', TEXT.check],
  ['05', 'changes', TEXT.reasonSide],
  ['06', 'approved', TEXT.approved],
] as const;

for (const [name, start, shown] of STATES)
  test(`${name}: the driver ${start}`, async ({ page }) => {
    await open(page, start);
    await expect(page.getByText(shown).first()).toBeVisible();
    await shot(page, name);
  });
