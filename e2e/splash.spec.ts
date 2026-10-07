import { brandForApp, loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { afterSplash, expect, test, type Page } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockFeedback } from './feedback-mock';
import { leftAt, slowApi, watch } from './splash-watch';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const brand = loadBrand();
const splash = (page: Page) => page.locator('#splash');
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(', ')})`;

// The splash of docs/121 §4 (G72, mockup g66/5) in all three Mini App.
for (const { name, port } of MINI_APPS) {
  test(`${name}: the splash in the color of the app stands while the first screen loads`, async ({
    page,
  }) => {
    const { brandStrong } = brandForApp(brand, name).theme.colors;
    // Drawn by the HTML itself: the page starts with the splash, before any script runs.
    const html = await (await page.request.get(appUrl(port))).text();
    expect(html).toContain('<body><div id="splash"');
    expect(html).toContain(`<style id="splash-style">html{background:${brandStrong}}`);
    await mockApi(page, 'active');
    await slowApi(page, 1_000);
    const ready = await watch(page);
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(port)));
    await expect(splash(page)).toBeVisible();
    await expect(splash(page)).toHaveCSS('background-color', rgb(brandStrong));
    await expect(page.locator('html')).toHaveCSS('background-color', rgb(brandStrong));
    await expect(splash(page)).toContainText(brand.name);
    await expect(splash(page)).toContainText(brand.slogan);
    await expect(splash(page).locator('button')).toHaveCount(0);
    await afterSplash(page);
    expect(await leftAt(page)).toBeGreaterThan(1_000);
    await expect.poll(() => ready.length, { timeout: 10_000 }).toBe(1);
    expect(ready[0]).toMatchObject({ screen: 'app', ms: expect.any(Number) });
  });
}

// The splash has no button: the Telegram button of the first screen waits for it (owner's phone, 07.10).
test('no Telegram button over the splash, the first screen gets it after', async ({ page }) => {
  await mockApi(page, 'active');
  await page.addInitScript(() => {
    const seen = { over: false };
    Object.assign(window, { buttonSeen: seen });
    new MutationObserver(() => {
      const button = document.getElementById('tg-main-button');
      if (button?.style.display === 'block' && document.querySelector('#splash:not(.splash-out)'))
        seen.over = true;
    }).observe(document, { childList: true, subtree: true, attributes: true });
  });
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await afterSplash(page);
  await expect(page.locator('#tg-main-button')).toHaveText(PASSENGER.mainButton);
  expect(
    await page.evaluate(() => (window as unknown as { buttonSeen: { over: boolean } }).buttonSeen.over),
  ).toBe(false);
});

test('a fast first screen: the splash still stands 0,6 s, then fades out in 0,3 s', async ({ page }) => {
  await mockApi(page, 'active');
  await watch(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await afterSplash(page);
  expect(await leftAt(page)).toBeGreaterThanOrEqual(900);
});

test('longer than 2 s: the white line runs at the top of the splash', async ({ page }) => {
  await mockApi(page, 'active');
  // The first screen keeps loading long after 2 s: a busy runner draws its frames late (lesson 155).
  await slowApi(page, 8_000);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  const line = page.locator('.splash-loader');
  await expect(line).toHaveCSS('opacity', '0');
  // The line waits exactly 2 s by its animation, then stays.
  const delays = await line.evaluate((element) =>
    element.getAnimations().map((animation) => animation.effect?.getTiming().delay),
  );
  expect(delays).toContain(2_000);
  await expect(line).toHaveCSS('opacity', '1', { timeout: 7_000 });
  const run = await line.evaluate((element) => getComputedStyle(element, '::after').backgroundColor);
  expect(run).toBe('rgb(255, 255, 255)');
});

test('an error of the first screen leads to its own screen, not an endless splash', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/me', (route) => route.fulfill({ status: 500, json: { error: 'internal' } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await afterSplash(page);
  await expect(page.getByText(t('errors.generic.title'))).toBeVisible();
});

test('no network: the splash leaves for the offline screen of G43', async ({ page }) => {
  await page.route('**/api/**', (route) => route.abort('internetdisconnected'));
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { get: () => false }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await afterSplash(page);
  await expect(page.getByText(t('common.offline'))).toBeVisible();
});

test('a link from a bot: right after the splash, the screen of the link', async ({ page }) => {
  await mockApi(page, 'active');
  await mockFeedback(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?review=b1`));
  await afterSplash(page);
  expect(await page.getByRole('button', { name: '5' }).isVisible()).toBe(true);
});

test('back from the background: no splash again', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await afterSplash(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(700);
  await expect(splash(page)).toHaveCount(0);
});
