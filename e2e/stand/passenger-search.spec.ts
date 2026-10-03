import { expect, test, type Page } from '@playwright/test';
import { TEXT } from '../apps';
import { pressBack } from '../telegram-mock';
import { CHILONZOR, publishTrip } from './market-kit';
import { SAMARQAND } from './g27-kit';
import { GAYRAT } from './people';
import { mainButton, NARROW, openHome, PLATFORMS, t, type Platform } from './screen-tour';
import { register } from './seed';
import { outsideCalls, type Person } from './stand-kit';

// A passenger looks for a trip (docs/97): the search by lists up to the sent booking, then a day
// with no trip and the request «Soʻrov qoldirish». Every screen is shot on both platforms.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const SEEKERS: Record<Platform, Person> = {
  android: { id: 900793, name: 'Shoxista', phone: '998901110793' },
  ios: { id: 900794, name: 'Gulchehra', phone: '998901110794' },
};

test.beforeAll(async () => {
  await publishTrip(GAYRAT, CHILONZOR, SAMARQAND, 'both');
  for (const person of Object.values(SEEKERS)) await register('passenger', person, 'female');
});

function shooter(page: Page, platform: Platform) {
  return async (name: string) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await page.screenshot({
      path: `screenshots/stand/passenger-search/${platform}/${name}.png`,
      animations: 'disabled',
    });
  };
}

// The map stands still and the name of the pin came: «Shu yerda» takes this place (lesson 77).
async function mapReady(page: Page, title: string) {
  await expect(page.getByText(t(title as 'way.point.from'))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  await expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'));
}

async function chooseRoute(page: Page, shot: (name: string) => Promise<void>, to: [string, string]) {
  await page.getByText(TEXT.from).click();
  await shot('03-from-regions');
  await page.getByAltText('Toshkent shahri').click();
  await shot('04-from-districts');
  await page.getByText('Chilonzor').click();
  await page.getByText(TEXT.to).click();
  await page.getByAltText(to[0]).click();
  await page.getByText(to[1], { exact: true }).click();
  await shot('05-route');
  await mainButton(page).click();
}

for (const platform of PLATFORMS)
  test(`${platform}: «Safar topish» → the trip → the seat asked`, async ({ page }) => {
    const shot = shooter(page, platform);
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await shot('01-home');
    await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
    await shot('02-search');
    await chooseRoute(page, shot, ['Samarqand viloyati', 'Samarqand shahri']);
    await shot('06-date');
    await page.getByText(TEXT.tomorrow).click();
    await expect(page.locator('.trip-card').first()).toBeVisible();
    await shot('07-results');
    await page.locator('.trip-card').filter({ hasText: GAYRAT.name }).first().click();
    await expect(page.getByText(TEXT.book)).toBeVisible();
    await shot('08-trip');
    await page.getByText(TEXT.book).click();
    await shot('09-seats');
    await page.getByText(t('market.request.seats', { count: '1' })).click();
    await shot('10-mode');
    await page.getByText(t('way.mode.door')).click();
    await mapReady(page, 'way.point.from');
    await shot('11-pickup');
    await mainButton(page).click();
    await mapReady(page, 'way.point.to');
    await shot('12-dropoff');
    await mainButton(page).click();
    await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
    await shot('13-review');
    await mainButton(page).click();
    await expect(page.getByText(t('bookings.sent.title'))).toBeVisible();
    await shot('14-sent');
  });

for (const platform of PLATFORMS)
  test(`${platform}: no trip that day → «Soʻrov qoldirish» → the request left`, async ({ page }) => {
    const shot = shooter(page, platform);
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
    await chooseRoute(page, async () => undefined, ['Xorazm viloyati', 'Urganch shahri']);
    await page.getByText(TEXT.tomorrow).click();
    await expect(page.getByText(t('market.search.empty'))).toBeVisible();
    await shot('20-empty');
    // The empty day only names the request: the person goes back home for it.
    const leave = page.getByText(t('common.passenger.leaveRequest'));
    await expect(async () => {
      if (!(await leave.isVisible())) await pressBack(page);
      await expect(leave).toBeVisible({ timeout: 1000 });
    }).toPass();
    await leave.click();
    await expect(mainButton(page)).toHaveText(TEXT.continue);
    await shot('21-way');
    await page.getByText(t('way.list')).click();
    await chooseRoute(page, async () => undefined, ['Xorazm viloyati', 'Urganch shahri']);
    await shot('22-way-filled');
    await mainButton(page).click();
    await shot('23-date');
    await page.getByText(TEXT.tomorrow).click();
    await shot('24-seats');
    await mainButton(page).click();
    await shot('25-price');
    await mainButton(page).click();
    await expect(mainButton(page)).toHaveText(t('market.request.publish'));
    await shot('26-review');
    await mainButton(page).click();
    await expect(mainButton(page)).toHaveText(t('market.done'));
    await shot('27-done');
  });
