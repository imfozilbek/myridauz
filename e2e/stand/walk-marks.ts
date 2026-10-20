import type { Page } from '@playwright/test';

// What the walk of the screens (G91) reads besides the words: the marks of the controls, the sounds,
// and the screens the app reports.
// A sound is a change too (the sounds of «Ovozlar», G54): every start of one is counted.
export const countSounds = (page: Page) =>
  page.addInitScript(() => {
    const start = AudioScheduledSourceNode.prototype.start;
    const counted = window as unknown as { __walkSounds?: number };
    AudioScheduledSourceNode.prototype.start = function (...args) {
      counted.__walkSounds = (counted.__walkSounds ?? 0) + 1;
      return start.apply(this, args);
    };
  });

// The marks of a screen that change without new words: a switch, a chosen chip, a typed value, a sound.
export const marksOf = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const marks = [
      ...document.querySelectorAll<HTMLElement>(
        '[aria-checked],[aria-selected],[aria-expanded],[aria-pressed],input,textarea',
      ),
    ].map((el) =>
      ['aria-checked', 'aria-selected', 'aria-expanded', 'aria-pressed']
        .map((name) => el.getAttribute(name))
        .concat((el as HTMLInputElement).value ?? '', String((el as HTMLInputElement).checked ?? ''))
        .join(','),
    );
    return [...marks, String((window as unknown as { __walkSounds?: number }).__walkSounds ?? 0)].join('|');
  });

// The app reports its screens when it goes to the background: the walk sends them at the end.
export async function flushScreens(page: Page) {
  const sent = page
    .waitForRequest((r) => r.url().endsWith('/analytics'), { timeout: 2_000 })
    .catch(() => null);
  const setState = (state: string) =>
    page.evaluate((value) => {
      Object.defineProperty(document, 'visibilityState', { value, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
  await setState('hidden');
  await sent;
  await page.waitForTimeout(500);
  await setState('visible');
}
