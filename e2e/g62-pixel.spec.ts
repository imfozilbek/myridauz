import { expect, type Page } from '@playwright/test';
import { test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import type { DriverStart } from './drivers-mock';
import { fillCar } from './driver-application';
import { mockTelegram, telegramUrl } from './telegram-mock';

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

test('1, 2, 3: the home before the application, «Mashinangiz» and «Mashina rasmi»', async ({ page }) => {
  await open(page, 'none');
  await expect(page.getByText(TEXT.becomeDriver)).toBeVisible();
  await shot(page, '01');
  await fillCar(page);
  await page.getByRole('button', { name: 'Cobalt', exact: true }).click();
  await shot(page, '02');
  await page.locator('#tg-main-button').click();
  // One photo since 18.10.2026: before it, the driver's own car drawn from the front with its plate.
  await expect(page.locator('.car-sketch .uz-plate')).toBeVisible();
  await shot(page, '03');
});

const STATES = [
  ['04', 'pending', TEXT.check],
  ['05', 'changes', TEXT.reasonFront],
  ['06', 'approved', TEXT.approved],
] as const;

for (const [name, start, shown] of STATES)
  test(`${name}: the driver ${start}`, async ({ page }) => {
    await open(page, start);
    // A fix asked opens the application over the main screen, which waits hidden under it (G77).
    await expect(page.getByText(shown).locator('visible=true').first()).toBeVisible();
    await shot(page, name);
  });
