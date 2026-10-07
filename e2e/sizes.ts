import { expect, type Page } from '@playwright/test';

// docs/121: nothing is cut on narrow and wide phones; the widths every new screen is checked at.
export const WIDTHS = [320, 375, 430] as const;
export const HEIGHT = 760;

// No text is cut inside its box, and the page never scrolls sideways.
export async function nothingCut(page: Page) {
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

// Elements of one kind are of one size (docs/121): the tiles, the cards, the chips.
export async function oneSize(page: Page, selector: string) {
  const sizes = await page
    .locator(selector)
    .evaluateAll((items) => items.map((item) => `${item.clientWidth}x${item.clientHeight}`));
  expect(new Set(sizes).size, `${selector}: ${sizes.join(' ')}`).toBe(1);
}
