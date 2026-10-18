import { expect, test, type Page } from './crash-guard';
import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { confirmed } from './bookings-mock';
import { mockStats } from './stats-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, , ADMIN] = MINI_APPS;
const shot = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/g87-${name}.png`, fullPage: true });
};

// G87 for the owner review (docs/33, docs/191): the new blocks of «Statistika», the week of each
// channel and the sheet of the reason after a cancel.
test('admin: the voice of people in «Statistika»', async ({ page }) => {
  await mockApi(page, 'active');
  await mockStats(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.management'), { exact: true }).click();
  await page.getByText(t('common.admin.statistics'), { exact: true }).click();
  await expect(page.getByText(t('stats.ratings.title'), { exact: true })).toBeVisible();
  await shot(page)('1-stats');
});

// Who joined and left this week and the reactions of the posts; a quiet channel says nothing new.
const WEEKS = [
  { joined: 14, gone: 3, reactions: 37, topReactions: 12 },
  { joined: 0, gone: 0, reactions: 0, topReactions: 0 },
  { joined: 6, gone: 1, reactions: 0, topReactions: 0 },
  { joined: 2, gone: 5, reactions: 12, topReactions: 7 },
];

test('admin: the week of each channel', async ({ page }) => {
  await mockApi(page, 'active');
  const channels = loadBrand()
    .channels.slice(0, WEEKS.length)
    .map(({ chat, link, title, places }) => ({ chat, link, title, places, fixed: true }));
  const health = channels.map(({ chat, title }, index) => ({
    chat,
    title,
    subscribers: 1200,
    canPost: true,
    checkedAt: Date.now(),
    failed: 0,
    arrivals: 3,
    ...WEEKS[index],
  }));
  await page.route('**/api/admin/channels', (route) => route.fulfill({ json: { channels } }));
  await page.route('**/api/admin/channel-health', (route) => route.fulfill({ json: { channels: health } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.management'), { exact: true }).click();
  await page.getByText(t('channels.title'), { exact: true }).click();
  await expect(page.getByText(/7 kunda: 14 kirdi/u)).toBeVisible();
  await shot(page)('2-channels');
});

test('passenger: why the seat was cancelled', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/passenger/bookings/*/cancel', (route) =>
    route.fulfill({ json: { ...confirmed, status: 'cancelled_by_passenger' } }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('bookings.cancel')).click();
  await expect(page.getByText(t('leave.title.booking'))).toBeVisible();
  // The sheet slides up: the last reason is on the screen once it stands.
  await expect(page.getByText(t('leave.reason.booking.other'))).toBeInViewport({ ratio: 1 });
  await shot(page)('3-seat-reason');
});

test('passenger: why the data went', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByLabel(TEXT.profile).click();
  await page.getByText(t('account.delete.open')).click();
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(t('leave.title.account'))).toBeVisible();
  await expect(page.getByText(t('leave.reason.account.other'))).toBeInViewport({ ratio: 1 });
  await shot(page)('4-data-reason');
});
