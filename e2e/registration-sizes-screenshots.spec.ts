import type { Page } from '@playwright/test';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { addFace, passConsent } from './registration';
import { mockTelegram, telegramUrl } from './telegram-mock';

// docs/121: nothing is cut on narrow and wide phones, tiles of one kind are of one size (G58).
const WIDTHS = [320, 375, 430] as const;
const HEIGHT = 760;

async function nothingCut(page: Page) {
  const cut = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((e) => e.children.length === 0 && e.scrollWidth > e.clientWidth + 1)
      .map((e) => e.textContent?.trim() ?? '')
      .filter(Boolean),
  );
  expect(cut).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0,
  );
}

for (const app of MINI_APPS.filter((item) => item.welcome))
  for (const width of WIDTHS)
    test(`${app.name} ${width}px: both screens of the registration fit`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await mockApi(page, 'unregistered');
      await mockTelegram(page);
      await page.goto(telegramUrl(appUrl(app.port)));
      const shot = (name: string) =>
        page.screenshot({
          path: `screenshots/registration/${app.name}-${width}-${name}.png`,
          fullPage: true,
        });
      await expect(page.getByText(TEXT.offerLink)).toBeVisible();
      await nothingCut(page);
      await passConsent(page, () => shot('1-welcome'));
      await addFace(page);
      await page.getByRole('radio', { name: TEXT.female }).click();
      await expect(page.getByText(TEXT.changePhoto)).toBeVisible();
      await nothingCut(page);
      const sizes = await page
        .getByRole('radio')
        .evaluateAll((tiles) => tiles.map((tile) => `${tile.clientWidth}x${tile.clientHeight}`));
      expect(new Set(sizes).size).toBe(1);
      await shot('2-about');
    });
