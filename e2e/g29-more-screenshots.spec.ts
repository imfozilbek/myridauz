import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { confirmed } from './bookings-mock';
import { summary } from './drivers-mock';
import { fromIfAsked, openOwnTrip, searchRoute } from './market';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER, ADMIN] = MINI_APPS;
const DAY = 86_400_000;
const shot = async (page: Page, name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/g29-${name}.png`, fullPage: true });
};
const open = async (page: Page, port: number) => {
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(port)));
};

// More screens of G29 for the owner review (docs/33, docs/89, docs/90).
test('passenger: «Orqaga» keeps the filters and «Qayerdan», «Boshqa joy» finds Samarkand', async ({
  page,
}) => {
  await mockApi(page, 'active');
  await open(page, PASSENGER.port);
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await fromIfAsked(page);
  await page.getByText(TEXT.otherPlace).click();
  await page.getByPlaceholder(TEXT.otherPlace).fill('Samarkand');
  await expect(page.getByText('Samarqand shahri', { exact: true })).toBeVisible();
  await shot(page, 'fp3-samarkand');
  await page.getByText('Samarqand shahri', { exact: true }).click();
  // The trips of the nearest day at once; «Orqaga» keeps «Qayerdan» (lesson 79).
  await expect(page.getByRole('tab').first()).toBeVisible();
  await pressBack(page);
  await expect(page.getByText(TEXT.directions)).toBeVisible();
  await shot(page, 'fp2-route-kept');
  await searchRoute(page);
  await page.getByText(TEXT.womanFilter).first().click();
  await page.getByText('Nodira', { exact: false }).click();
  await pressBack(page);
  await expect(page.getByText('Nodira', { exact: false })).toBeVisible();
  await shot(page, 'fp1-filters-kept');
});

test('passenger: «Mashinaga chiqdim» only on the day of the trip (P7)', async ({ page }) => {
  await mockApi(page, 'active');
  const tomorrow = { ...confirmed, trip: { ...confirmed.trip, departAt: Date.now() + DAY } };
  await page.route('**/api/passenger/bookings', (route) => route.fulfill({ json: { bookings: [tomorrow] } }));
  await open(page, PASSENGER.port);
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await expect(page.getByText(t('bookings.toClose'))).toBeVisible();
  await shot(page, 'p7-tomorrow');
});

test('driver: the bookings of a trip in a clear order (F-D11)', async ({ page }) => {
  await mockApi(page, 'active');
  const { trip } = confirmed;
  const person = (firstName: string) => ({ ...confirmed.passenger, firstName });
  const bookings = [
    {
      ...confirmed,
      id: `${confirmed.id.slice(0, -1)}7`,
      status: 'cancelled_by_passenger',
      passenger: person('Aziz'),
    },
    { ...confirmed, passenger: person('Madina') },
    {
      ...confirmed,
      id: `${confirmed.id.slice(0, -1)}8`,
      status: 'requested',
      extraKm: 9,
      passenger: person('Olim'),
    },
    {
      ...confirmed,
      id: `${confirmed.id.slice(0, -1)}9`,
      status: 'requested',
      extraKm: 2,
      passenger: person('Zarina'),
    },
  ];
  await page.route('**/api/driver/trips', (route) => route.fulfill({ json: { trips: [trip] } }));
  await page.route('**/api/driver/bookings', (route) => route.fulfill({ json: { bookings } }));
  await open(page, DRIVER.port);
  await page.getByText(t('common.myTrips')).first().click();
  await openOwnTrip(page);
  await expect(page.getByText('Zarina')).toBeVisible();
  await shot(page, 'fd11-order');
});

test('moderation: after a decision the next application opens at once (S9)', async ({ page }) => {
  await mockApi(page, 'active');
  const next = { ...summary, userId: '0000000000000000000000000000000c', firstName: 'Vali' };
  let decided = false;
  await page.route('**/api/admin/applications', (route) =>
    route.fulfill({ json: { applications: decided ? [next] : [summary, next] } }),
  );
  await page.route('**/api/admin/applications/*/decision', (route) => {
    decided = true;
    return route.fulfill({ json: { ...summary, status: 'approved' } });
  });
  await open(page, ADMIN.port);
  await page.getByText(ADMIN.action).click();
  await page.getByText('Jasur').click();
  await page.locator('#tg-main-button', { hasText: TEXT.approve }).click();
  await page.locator('#tg-main-button', { hasText: TEXT.plateMatches }).click();
  await expect(page.getByText('Vali').first()).toBeVisible();
  await expect(page.getByText(t('moderation.decided'))).toBeVisible();
  await shot(page, 's9-next');
});
