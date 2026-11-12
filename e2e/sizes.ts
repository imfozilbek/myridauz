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

// Pills the mockup sizes by their words (the times of a sheet) keep one height (docs/121), with their
// line: a tile with a red line is as high as the others (G66).
export async function oneHeight(page: Page, selector: string) {
  const heights = await page
    .locator(selector)
    .evaluateAll((items) => items.map((item) => (item as HTMLElement).offsetHeight));
  expect(new Set(heights).size, `${selector}: ${heights.join(' ')}`).toBe(1);
}

// iOS paints the words of a button system blue by itself (lesson 391): every word on a button keeps
// the color the screen gives it. The blue stays on the page, as an iPhone shows it.
const IOS_BLUE = 'rgb(0, 122, 255)';
export async function noSystemBlue(page: Page) {
  await page.addStyleTag({ content: `button { color: ${IOS_BLUE}; }` });
  const blue = await page.evaluate(
    (ios) =>
      [...document.querySelectorAll<HTMLElement>('button, button *')]
        .filter((e) =>
          [...e.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()),
        )
        .filter((e) => getComputedStyle(e).color === ios)
        .map((e) => e.textContent?.trim() ?? ''),
    IOS_BLUE,
  );
  expect(blue).toEqual([]);
}
