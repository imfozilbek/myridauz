import { appendFileSync, mkdirSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import type { MiniApp } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { pressBack } from '../telegram-mock';
import { readStability, watchStability } from './stability';
import { openAs, type Person } from './stand-kit';

// A walk through the screens of one Mini App for the UX review of G27 (docs/83): every step is a
// screenshot at Android 360 px, the main screens also on iOS (lesson 52).
export const { t } = createI18n(DEFAULT_LOCALE);
export type Platform = 'android' | 'ios';
export const PLATFORMS: readonly Platform[] = ['android', 'ios'];
export const NARROW = { width: 360, height: 760 };

export const shot = async (page: Page, platform: Platform, name: string) => {
  await page.waitForLoadState('networkidle');
  // A screen still loading shows its skeleton: the shot waits for the content.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  // A map on the screen is drawn before the shot, its tiles too.
  await expect(page.locator('[data-state="loading"]')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  // Photos come as blobs after the list: every picture is drawn before the shot.
  await expect
    .poll(() =>
      page.evaluate(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0)),
    )
    .toBe(true);
  // Nothing wider than the phone (lesson 52): the widest element must fit the screen.
  const overflow = await page.evaluate(() => {
    const right = (element: Element) => element.getBoundingClientRect().right;
    const wide = [...document.querySelectorAll<HTMLElement>('body *')].find(
      (element) => right(element) > window.innerWidth + 1,
    );
    return wide ? `${wide.tagName}.${wide.className}` : null;
  });
  expect.soft(overflow, `${name}: wider than the screen`).toBeNull();
  // Texts cut with «…»: written down for the UX review, a long place name may be fine, a label not.
  const cut = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((e) => e.children.length === 0 && e.scrollWidth > e.clientWidth + 1)
      .map((e) => e.textContent?.trim() ?? '')
      .filter(Boolean),
  );
  if (cut.length > 0) appendFileSync(CUT, cut.map((text) => `${platform}/${name}: ${text}\n`).join(''));
  await page.screenshot({ path: `screenshots/stand/g27/${platform}/${name}.png`, animations: 'disabled' });
  // Every blink and jump since the last shot is written down under this name (G41, docs/108).
  await readStability(page, `${platform}/${name}`);
  await sendScreens(page);
};

// The app sends its analytics when it goes to the background: the walk does that after each shot,
// so the opened screens are written down at once.
async function sendScreens(page: Page) {
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
  await setState('visible');
}

// Every screen that reports «screen_open» is written down: the walk shows which screens it reached.
const SEEN = 'screenshots/stand/g27/screens-seen.txt';
const CUT = 'screenshots/stand/g27/texts-cut.txt';
mkdirSync('screenshots/stand/g27', { recursive: true });
function recordScreens(page: Page) {
  page.on('request', (request) => {
    if (!request.url().endsWith('/analytics') || request.method() !== 'POST') return;
    const { events } = JSON.parse(request.postData() ?? '{"events":[]}') as {
      events: { name: string; screen: string }[];
    };
    const opened = events.filter((e) => e.name === 'screen_open').map((e) => `${e.screen}\n`);
    if (opened.length > 0) appendFileSync(SEEN, opened.join(''));
  });
}

export async function openHome(page: Page, app: MiniApp, person: Person, platform: Platform, search = '') {
  recordScreens(page);
  await watchStability(page);
  await openAs(page, app, person, { platform, search });
  await page.waitForLoadState('networkidle');
}

// Opens a screen from the current one by its label, takes the shot and goes back.
// ready: a text the screen shows once its data came, such as the name of the place under the pin.
export async function visit(
  page: Page,
  platform: Platform,
  label: string | RegExp,
  name: string,
  ready?: string,
) {
  const back = page.url();
  await page.getByText(label).first().click();
  if (ready) await expect(page.getByText(ready).first()).toBeVisible();
  await shot(page, platform, name);
  await pressBack(page);
  await expect.poll(() => page.url()).toBe(back);
}

export const mainButton = (page: Page) => page.locator('#tg-main-button');
