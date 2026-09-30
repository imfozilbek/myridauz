import { expect, test } from '@playwright/test';
import { appUrl, LANDING_PORT } from './apps';
import { mockPrices } from './landing-mock';

const shot = (name: string) => `screenshots/landing-${name}.png`;

// The landing for the owner review (docs/33): each part on a phone, then the whole page on a computer.
test('landing: screenshots on a phone', async ({ page }) => {
  await mockPrices(page);
  await page.goto(appUrl(LANDING_PORT));
  await page.screenshot({ path: shot('1-first-screen') });
  for (const [name, selector] of [
    ['1-numbers', '.numbers'],
    ['2-pains', '.pains'],
    ['3-how', '.how'],
    ['4-map', '.map'],
    ['4-directions', '.directions'],
    ['5-driver', '.driver-side'],
    ['6-safety', '.safety'],
    ['7-telegram', '.telegram'],
    ['8-faq', '.faq'],
    ['9-final', '.final'],
  ] as const) {
    const section = page.locator(selector);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(name === '2-pains' ? 2600 : 1500);
    await section.screenshot({ path: shot(name) });
  }
  await expect(page.locator('[data-price]')).not.toBeEmpty();
});

test('landing: a direction page on a phone', async ({ page }) => {
  await mockPrices(page);
  await page.goto(`${appUrl(LANDING_PORT)}/yonalish/toshkent-samarqand/`);
  await page.screenshot({ path: shot('12-direction-first') });
  await page.locator('.map').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-price]')).not.toBeEmpty();
  await page.locator('.map').screenshot({ path: shot('13-direction-map') });
});

test('landing: screenshots on a computer', async ({ page }) => {
  await mockPrices(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(appUrl(LANDING_PORT));
  await page.screenshot({ path: shot('10-desktop-first') });
  await page.locator('.map').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator('.map').screenshot({ path: shot('11-desktop-map') });
});
