import { afterSplash, expect, test, type Page } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { HEIGHT, nothingCut, WIDTHS } from './sizes';
import { mockTelegram, telegramUrl } from './telegram-mock';

// G72 on narrow and wide phones (docs/121): the splash, the top loader and the gradient of every Mini
// App fit, nothing is cut and nothing jumps after the splash leaves (G41).
const inside = async (page: Page, selector: string, width: number) => {
  const box = await page.locator(selector).boundingBox();
  expect(box, selector).not.toBeNull();
  expect(box?.x ?? -1, selector).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0), selector).toBeLessThanOrEqual(width);
};
// Where every element of the screen stands: the same a moment later means nothing jumped.
const layout = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#root *')]
      .map((element) => element.getBoundingClientRect())
      .map(({ x, y, width, height }) => `${x},${y},${width},${height}`)
      .join(' '),
  );

for (const app of MINI_APPS)
  for (const width of WIDTHS)
    test(`${app.name} ${width}px: splash, loader and background fit`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await mockApi(page, 'active');
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.fallback();
      });
      await mockTelegram(page);
      await page.goto(telegramUrl(appUrl(app.port)));
      for (const part of ['.splash-logo', '.splash-name', '.splash-slogan']) await inside(page, part, width);
      await page.locator('#splash').screenshot({ path: `screenshots/look/${app.name}-${width}-splash.png` });
      await expect(page.locator('.top-loader')).toBeAttached();
      const line = await page.locator('.top-loader').boundingBox();
      expect(line?.width).toBe(width);
      await afterSplash(page);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.top-loader')).toHaveCount(0, { timeout: 5_000 });
      await nothingCut(page);
      expect(await page.evaluate(() => document.body.style.background)).toContain('linear-gradient');
      // The arrow «Hozir» swings 3 times and the block rises once (G76): the screen stands after.
      await page.waitForFunction(() => document.getAnimations().length === 0);
      const before = await layout(page);
      await page.waitForTimeout(1_000);
      expect(await layout(page)).toBe(before);
      await page.screenshot({ path: `screenshots/look/${app.name}-${width}-home.png` });
    });
