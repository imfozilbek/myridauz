import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { mockFeedback } from './feedback-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;

// What a page sent to one address of the API, in order.
async function sentTo(page: Page, path: string) {
  const bodies: unknown[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith(path))
      bodies.push(request.postDataJSON());
  });
  return bodies;
}

// The main paths of the launch that the other smoke tests do not walk (G16, docs/31):
// a passenger cancels a seat, rates the driver and complains.
test('passenger: cancels a confirmed seat', async ({ page }) => {
  await mockApi(page, 'active');
  const cancelled: string[] = [];
  await page.route('**/api/passenger/bookings/*/cancel', async (route) => {
    cancelled.push(new URL(route.request().url()).pathname);
    await route.fulfill({ json: { ...confirmed, status: 'cancelled_by_passenger' } });
  });
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('bookings.cancel')).click();
  await expect.poll(() => cancelled).toHaveLength(1);
  expect(cancelled[0]).toBe(`/api/passenger/bookings/${confirmed.id}/cancel`);
  await expect(page.locator('.market-tabs')).toBeVisible();
  await expect(page.getByText(t('errors.generic.title'))).toHaveCount(0);
});

test('passenger: rates the driver, then complains about the trip', async ({ page }) => {
  await mockApi(page, 'active');
  await mockFeedback(page);
  const reviews = await sentTo(page, '/api/reviews');
  const complaints = await sentTo(page, '/api/complaints');
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?review=b1`));
  await page.getByRole('button', { name: '5' }).click();
  await page.getByText(t('reviews.tag.on_time')).click();
  await page.locator('#tg-main-button').click();
  await expect.poll(() => reviews.length).toBe(1);
  expect(reviews[0]).toMatchObject({ stars: 5, tags: ['on_time'] });
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?complain=b1`));
  await page.getByText(t('complaints.reason.no_show')).click();
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(t('complaints.sent'))).toBeVisible();
  expect(complaints[0]).toMatchObject({ reasons: ['no_show'] });
});
