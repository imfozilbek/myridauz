import { expect, type Locator, type Page } from '@playwright/test';
import { pressBack } from '../telegram-mock';

// A screen is reached step by step: one tap, then the screen it left changes, then the next tap (G71).
// A tap waits only for the change, a few tenths of a second, not a whole second per step; and it
// never taps twice on one screen.
const SCREEN_CHANGE_MS = 5_000;
const MAX_STEPS = 12;
const screenText = (page: Page) => page.locator('body').innerText();

export async function stepUntil(page: Page, target: Locator, step: () => Promise<void>) {
  for (let taps = 0; taps < MAX_STEPS; taps += 1) {
    if (await target.isVisible()) return;
    const before = await screenText(page);
    await step();
    await expect
      .poll(async () => (await target.isVisible()) || (await screenText(page)) !== before, {
        intervals: [50],
        timeout: SCREEN_CHANGE_MS,
      })
      .toBe(true);
  }
  await expect(target).toBeVisible();
}

// «Назад» until a screen shows: the app keeps its screen while it stays open.
export const backUntil = (page: Page, target: Locator) => stepUntil(page, target, () => pressBack(page));
