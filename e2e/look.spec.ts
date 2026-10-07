import { loadBrand } from '@platform/brands';
import { expect, test, type Page } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The look of every Mini App (G72): the top loader of docs/121 §3.
const [PASSENGER] = MINI_APPS;
const loader = (page: Page) => page.locator('.top-loader');
// Every line ever drawn is written down: a fast answer must never draw one.
const watchLoader = (page: Page) =>
  page.addInitScript(() => {
    const seen = { lines: 0 };
    Object.assign(window, { loaderSeen: seen });
    new MutationObserver(() => {
      if (document.querySelector('.top-loader')) seen.lines += 1;
    }).observe(document, { childList: true, subtree: true });
  });
const linesSeen = (page: Page) =>
  page.evaluate(() => (window as unknown as { loaderSeen: { lines: number } }).loaderSeen.lines);

async function open(page: Page, slowMs: number) {
  await mockApi(page, 'active');
  await page.route('**/api/passenger/bookings', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, slowMs));
    await route.fulfill({ json: { bookings: [] } });
  });
  await watchLoader(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
}

test('a slow answer shows the line of the Mini App color, then it leaves', async ({ page }) => {
  await open(page, 2_000);
  await expect(loader(page)).toBeVisible();
  const box = await loader(page).boundingBox();
  expect(box?.y).toBe(0);
  expect(box?.height).toBe(3);
  const color = await page
    .locator('.top-loader-run')
    .evaluate((run) => getComputedStyle(run).backgroundColor);
  const strong = loadBrand().theme.colors.brandStrong;
  const rgb = [1, 3, 5].map((at) => parseInt(strong.slice(at, at + 2), 16)).join(', ');
  expect(color).toBe(`rgb(${rgb})`);
  await expect(loader(page)).toHaveCount(0, { timeout: 5_000 });
});

test('a fast answer never shows the line', async ({ page }) => {
  await open(page, 0);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  expect(await linesSeen(page)).toBe(0);
});
