import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { expect, test } from './crash-guard';
import { openBookingPoints } from './g63-note-mock';
import { openTripAt } from './g63-pixel-mock';
import { startPublish } from './g63-publish-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of the form sheets (G75, lessons 141, 147, 160): the phones of g75/3 A at the size of
// the mockup (360 × 760 at 1); only the sheet is measured, the screen under its shade is the real one.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const OUT = 'screenshots/pixel-g75';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

test('3-1: «Qachon joʻnaysiz?»', async ({ page }) => {
  // The day of the mockup: today 12 October, the trip tomorrow, «13-okt».
  await page.clock.setFixedTime(Date.parse('2026-10-12T10:00:00+05:00'));
  await startPublish(page);
  await page.getByText(/^(Bugun|Ertaga), \d\d:\d\d$/u).click();
  await page.getByText(t('market.day.tomorrow'), { exact: true }).click();
  await expect(page.getByRole('button', { name: '08:00', pressed: true })).toBeVisible();
  await page.screenshot({ path: `${OUT}/3-1-code.png`, animations: 'disabled' });
});

test('3-2: «Vaqt yoki narx»', async ({ page }) => {
  await openTripAt(page, '2026-10-06T14:20', false);
  await page.getByText(t('driverTrip.tile.change')).click();
  await page.getByText(t('market.change.at', { time: '08:30' })).click();
  await page.screenshot({ path: `${OUT}/3-2-code.png`, animations: 'disabled' });
});

test('3-3: «Izoh» of a booking', async ({ page }) => {
  await openBookingPoints(page);
  await page.getByText(t('bookings.points.note')).click();
  await page.getByPlaceholder(t('market.comment.placeholder')).fill('Bitta katta sumkam bor');
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${OUT}/3-3-code.png`, animations: 'disabled' });
});

test('3-4: «Xabar bering» from a channel', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(`${telegramUrl(appUrl(PASSENGER.port))}&tgWebAppStartParam=sub_1726_1718401_2026-10-12`);
  await expect(page.getByText(t('subscriptions.when.any'))).toBeVisible();
  await page.screenshot({ path: `${OUT}/3-4-code.png`, animations: 'disabled' });
});
