import { expect, test, type Page } from '@playwright/test';
import { TEXT } from '../apps';
import { HUMOYUN } from './people';
import { pressBack } from '../telegram-mock';
import { mainButton, NARROW, openHome, PLATFORMS, t, type Platform } from './screen-tour';
import { register } from './seed';
import { outsideCalls, type Person } from './stand-kit';

// The requests of a passenger and the search of a driver (G37, docs/101): an empty day, a request,
// a second one on the same day refused, the own list; the driver finds it, moves to tomorrow and
// publishes a trip from an empty day.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const SEEKERS: Record<Platform, Person> = {
  android: { id: 900801, name: 'Nilufar', phone: '998901110801' },
  ios: { id: 900802, name: 'Shahlo', phone: '998901110802' },
};

test.beforeAll(async () => {
  for (const person of Object.values(SEEKERS)) await register('passenger', person, 'female');
});

const shooter = (page: Page, platform: Platform) => async (name: string) => {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({
    path: `screenshots/stand/requests-review/${platform}/${name}.png`,
    animations: 'disabled',
  });
};

// «Назад» up to the main screen: the app keeps its screen while it stays open.
async function toHome(page: Page) {
  const find = mainButton(page).filter({ hasText: TEXT.findTrip });
  await expect(async () => {
    if (!(await find.isVisible())) await pressBack(page);
    await expect(find).toBeVisible({ timeout: 1000 });
  }).toPass();
}

// From the empty day of Yunusobod (the place of the person) → Termiz shahri up to the review of a request: the way of the last
// request may be kept, so each step is answered only when it shows (G35 K4).
async function requestToReview(page: Page) {
  await toHome(page);
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await page.getByAltText('Surxondaryo viloyati').click();
  await page.getByText('Termiz shahri', { exact: true }).click();
  await expect(page.getByText(t('market.search.empty'))).toBeVisible();
  await mainButton(page)
    .filter({ hasText: t('common.passenger.leaveRequest') })
    .click();
  // The empty day and the review both say «Soʻrov qoldirish»: the title tells the review.
  const publish = page.getByText(t('market.request.review.title'));
  const door = page.getByText(t('way.mode.door'), { exact: true });
  await expect(async () => {
    if (await publish.isVisible()) return;
    if (await door.isVisible()) await door.click();
    else if (await page.getByRole('status').isVisible()) {
      await expect(page.getByRole('status')).not.toHaveText(/aniqlanmoqda|hududida emas/u, {
        timeout: 15_000,
      });
      await mainButton(page).click();
    } else await mainButton(page).click();
    await expect(publish).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 60_000 });
}

for (const platform of PLATFORMS)
  test(`${platform}: a request, a second one refused, the driver finds it`, async ({ page }) => {
    test.setTimeout(120_000);
    const shot = shooter(page, platform);
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
    await page.getByAltText('Surxondaryo viloyati').click();
    await page.getByText('Termiz shahri', { exact: true }).click();
    await expect(page.getByText(t('market.search.empty'))).toBeVisible();
    await shot('01-p-empty');
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await requestToReview(page);
    await mainButton(page).click();
    await expect(mainButton(page)).toHaveText(t('market.done'));
    // The same route and day again: the first request is offered, no second one (R5).
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await requestToReview(page);
    await mainButton(page).click();
    await expect(page.getByText(t('errors.trips.request_exists'))).toBeVisible();
    await shot('02-p-second');
    await page.getByText(t('market.request.openMine')).click();
    await expect(page.getByText(t('market.request.cancel'))).toBeVisible();
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await toHome(page);
    await page.getByText(t('common.myTrips')).first().click();
    await expect(page.locator('.trip-card')).toHaveCount(1);
    await shot('03-p-mine');
    // The driver: the request of today, then tomorrow and its empty day (R2, R3, R4).
    await openHome(page, 'driver', HUMOYUN, platform);
    await page.getByText(t('common.driver.passengerRequests')).first().click();
    await page.getByText(TEXT.from).click();
    await page.getByAltText('Toshkent shahri').click();
    await page.getByText('Yunusobod').click();
    // «Qayerga» opens by itself, both ends go on (G40, docs/106 K1).
    await page.getByAltText('Surxondaryo viloyati').click();
    await page.getByText('Termiz shahri', { exact: true }).click();
    await expect(page.locator('.trip-card').filter({ hasText: SEEKERS[platform].name })).toBeVisible();
    await shot('04-d-requests');
    await page.getByText(t('market.day.tomorrow'), { exact: true }).click();
    await expect(page.getByText(t('market.requests.empty'))).toBeVisible();
    await expect(page.getByText(t('market.requests.hint'))).toHaveCount(0);
    await shot('05-d-empty');
    await page.getByText(t('market.requests.publish')).click();
    // No pitak to Termiz: no choice of the way, the day is next (G40, docs/106 K2).
    await expect(page.getByText(t('market.when.title'))).toBeVisible();
    await shot('06-d-publish');
  });
