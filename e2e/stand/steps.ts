import { expect, type Locator, type Page } from '@playwright/test';
import { pressBack } from '../telegram-mock';

// A screen is reached step by step: one tap, then the screen it left changes, then the next tap (G71).
// A tap waits only until the screen changed and settled, a few tenths of a second, not a whole second
// per step; and it never taps twice on one screen.
const SCREEN_CHANGE_MS = 5_000;
const MAX_STEPS = 12;
const screenText = (page: Page) => page.locator('body').innerText();

// The screen has changed and settled: nothing loads, and two looks in a row see the same screen. A
// screen that only began to load is not the next step yet: a second tap there would go one too far.
async function settledAfter(page: Page, target: Locator, before: string) {
  let last = '';
  await expect
    .poll(
      async () => {
        const loading = (await page.locator('[aria-busy="true"]').count()) > 0;
        const now = await screenText(page);
        const settled = !loading && now === last && now !== before;
        last = now;
        return settled || (!loading && (await target.isVisible()));
      },
      { intervals: [100], timeout: SCREEN_CHANGE_MS },
    )
    .toBe(true);
}

export async function stepUntil(page: Page, target: Locator, step: () => Promise<void>) {
  for (let taps = 0; taps < MAX_STEPS; taps += 1) {
    if (await target.isVisible()) return;
    const before = await screenText(page);
    await step();
    await settledAfter(page, target, before);
  }
  await expect(target).toBeVisible();
}

// «Назад» until a screen shows: the app keeps its screen while it stays open.
export const backUntil = (page: Page, target: Locator) => stepUntil(page, target, () => pressBack(page));
