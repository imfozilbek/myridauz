import { test } from '@playwright/test';
import { appUrl, LANDING_PORT } from './apps';

// The landing for the owner review (docs/33): the whole main page and a document, on a phone.
test('landing: screenshots', async ({ page }) => {
  await page.goto(appUrl(LANDING_PORT));
  await page.screenshot({ path: 'screenshots/landing-1-first-screen.png' });
  await page.screenshot({ path: 'screenshots/landing-2-full.png', fullPage: true });
  await page.goto(`${appUrl(LANDING_PORT)}offer/`);
  await page.screenshot({ path: 'screenshots/landing-3-offer.png' });
});

test('landing: screenshots on a computer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(appUrl(LANDING_PORT));
  await page.screenshot({ path: 'screenshots/landing-4-desktop.png', fullPage: true });
});
