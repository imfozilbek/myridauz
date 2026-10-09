import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { fromIfAsked } from './market';
import { register } from './registration';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Screenshots for the owner review (docs/33): registration, main screen and profile of each Mini App.
for (const app of MINI_APPS) {
  test(`${app.name}: screenshots`, async ({ page }) => {
    await mockApi(page, app.welcome ? 'unregistered' : 'active');
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(app.port)));
    const shot = (name: string) => page.screenshot({ path: `screenshots/miniapp-${app.name}-${name}.png` });
    if (app.welcome) await register(page, app.welcome, shot);
    await expect(page.getByText(app.action).first()).toBeVisible();
    await shot('6-home');
    if (!app.welcome) return;
    await page.getByLabel(TEXT.profile).click();
    // A new person: «Yangi» on the rating and on «vaqtida» (G65, mockup g65/3).
    await expect(page.getByText('Yangi', { exact: true })).toHaveCount(2);
    await shot('7-profile');
  });
}

test('blocked: screenshot', async ({ page }) => {
  await mockApi(page, 'blocked');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(MINI_APPS[0].port)));
  await expect(page.getByText(TEXT.blocked)).toBeVisible();
  await page.screenshot({ path: 'screenshots/miniapp-blocked.png' });
});

test('places: screenshots', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(MINI_APPS[0].port)));
  // The mouse leaves the screen first: a phone has no hover state.
  const shot = async (name: string) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `screenshots/places-${name}.png`, fullPage: true });
  };
  // «Qayerdan» is changed by its list (G59): the regions, the search, the districts.
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await fromIfAsked(page);
  await page.getByText(TEXT.change).click();
  await expect(page.getByAltText('Xorazm viloyati')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await shot('2-regions');
  const search = page.getByPlaceholder(TEXT.search);
  await search.fill("g'ijduvon");
  await expect(page.getByText('Gʻijduvon')).toBeVisible();
  await shot('4-search');
  await search.fill('');
  await page.getByAltText('Toshkent shahri').click();
  await shot('3-districts');
  await page.getByText('Yunusobod').click();
  // A place of the same city is refused under the search (docs/14).
  await page.getByText(TEXT.otherPlace).click();
  await page.getByPlaceholder(TEXT.otherPlace).fill('Chilon');
  await page.getByText('Chilonzor', { exact: true }).click();
  await expect(page.getByText(TEXT.insideCity)).toBeVisible();
  await shot('6-inside-city');
});
