import { expect, type Page } from '@playwright/test';
import type { MiniApp } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { pressBack } from '../telegram-mock';
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
      (element) =>
        right(element) > window.innerWidth + 1 ||
        (element.parentElement?.classList.contains('way-card') &&
          right(element) > right(element.parentElement) + 1),
    );
    return wide ? `${wide.tagName}.${wide.className}` : null;
  });
  expect.soft(overflow, `${name}: wider than the screen`).toBeNull();
  await page.screenshot({ path: `screenshots/stand/g27/${platform}/${name}.png`, animations: 'disabled' });
};

export async function openHome(page: Page, app: MiniApp, person: Person, platform: Platform) {
  await openAs(page, app, person, { platform });
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
