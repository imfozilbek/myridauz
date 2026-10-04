import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed, offer } from './bookings-mock';
import { mockFeedback } from './feedback-mock';
import { tripOf } from './market-mock';
import { mockStats } from './stats-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The main screens as tiles (G53, docs/114): every state of the mockups the owner chose.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER, ADMIN] = MINI_APPS;
const json = (page: Page, path: string, body: unknown) =>
  page.route(path, (route) => route.fulfill({ json: body }));
const ANDROID = { width: 360, height: 800 };

for (const platform of ['android', 'ios'] as const) {
  test.describe(platform, () => {
    if (platform === 'android') test.use({ viewport: ANDROID });
    const shot = (page: Page, name: string) =>
      page.screenshot({ path: `screenshots/tiles-${platform}-${name}.png` });
    const open = async (page: Page, port: number, driver: 'approved' | 'pending' = 'approved') => {
      await mockApi(page, 'active', driver);
      await mockTelegram(page);
      return () => page.goto(telegramUrl(appUrl(port), platform));
    };

    test('passenger A: new, a confirmed seat, a request with offers', async ({ page }) => {
      const go = await open(page, PASSENGER.port);
      await json(page, '**/api/passenger/bookings', { bookings: [] });
      await json(page, '**/api/passenger/offers', { offers: [] });
      await go();
      await expect(page.getByText(t('way.toEmpty'))).toBeVisible();
      await expect(page.getByText(t('home.profileHint'))).toBeVisible();
      await shot(page, 'p1-new');
      // A search done before: «Oxirgi yoʻnalish» takes its route (G35 K5).
      await page.evaluate(() =>
        localStorage.setItem('route_recent', JSON.stringify([{ from: '1726294', to: '1718401' }])),
      );
      await json(page, '**/api/passenger/bookings', { bookings: [{ ...confirmed, unread: 1 }] });
      await page.reload();
      await expect(page.getByText(t('home.driver.last'))).toBeVisible();
      await expect(page.getByText(t('home.unread', { count: '1' }))).toBeVisible();
      await expect(page.getByText(t('bookings.status.confirmed'))).toBeVisible();
      await shot(page, 'p2-confirmed');
      await json(page, '**/api/passenger/bookings', { bookings: [] });
      await json(page, '**/api/passenger/offers', { offers: [offer, { ...offer, id: 'o2' }] });
      await page.reload();
      await expect(page.getByText(t('market.request.offers', { count: '2' })).first()).toBeVisible();
      await shot(page, 'p3-offers');
    });

    test('driver A: on the check, approved, a trip with requests', async ({ page }) => {
      const pending = await open(page, DRIVER.port, 'pending');
      await pending();
      await expect(page.getByText(t('home.supportHint'))).toBeVisible();
      await shot(page, 'd1-check');
    });

    test('driver A: approved without trips and with a trip', async ({ page }) => {
      const go = await open(page, DRIVER.port);
      await json(page, '**/api/driver/bookings', { bookings: [] });
      await go();
      await expect(page.getByText(t('common.myTrips'))).toBeVisible();
      await expect(page.getByText(/^Bonus /u)).toBeVisible();
      await shot(page, 'd2-free');
      const trip = tripOf('7', 'Jasur', false, 20);
      const asked = { ...confirmed, id: 'b7', status: 'requested', trip };
      await json(page, '**/api/driver/trips', { trips: [trip] });
      await json(page, '**/api/driver/bookings', { bookings: [asked, { ...asked, id: 'b8' }] });
      await page.reload();
      await expect(page.getByText(t('home.requests', { count: '2' }))).toBeVisible();
      await shot(page, 'd3-trip');
    });

    test('admin C: work waits, all done', async ({ page }) => {
      const go = await open(page, ADMIN.port);
      await mockFeedback(page);
      await mockStats(page);
      await go();
      await expect(page.getByText(t('home.admin.newUsers'))).toBeVisible();
      await expect(page.getByText(t('home.admin.waiting'))).toBeVisible();
      await shot(page, 'a1-work');
      await json(page, '**/api/admin/applications', { applications: [] });
      await json(page, '**/api/admin/complaints', { complaints: [] });
      await page.reload();
      await expect(page.getByText(t('common.admin.management'))).toBeVisible();
      await shot(page, 'a2-done');
    });
  });
}
