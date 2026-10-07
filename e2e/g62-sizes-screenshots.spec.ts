import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { test } from './crash-guard';
import { fillCar } from './driver-application';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [, DRIVER] = MINI_APPS;

// docs/121 on narrow and wide phones (G62): «Mashinangiz», «Mashina rasmlari» and the fix; nothing is
// cut, the model buttons, the color dots and the photo tiles are of one size each.
for (const width of WIDTHS) {
  test(`${width}px: the application fits`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await mockApi(page, 'active', 'none');
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(DRIVER.port)));
    await fillCar(page);
    await nothingCut(page);
    await oneSize(page, '.car-color');
    await page.screenshot({ path: `screenshots/look/g62-car-${width}.png`, fullPage: true });
    await page.locator('#tg-main-button').click();
    await page.getByText(TEXT.photos).waitFor();
    await nothingCut(page);
    await oneSize(page, '.photo-tile');
    await page.screenshot({ path: `screenshots/look/g62-photos-${width}.png`, fullPage: true });
  });

  test(`${width}px: the fix fits`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await mockApi(page, 'active', 'changes');
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(DRIVER.port)));
    await page.locator('.photo-tile-problem').waitFor();
    await nothingCut(page);
    await page.screenshot({ path: `screenshots/look/g62-fix-${width}.png`, fullPage: true });
  });
}
