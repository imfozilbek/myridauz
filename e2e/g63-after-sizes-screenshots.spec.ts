import { expect, test, type Page } from './crash-guard';
import { fiveStars, live, madina, pastSeats, pastTrip } from './g63-after-data';
import { mockupTrip, openDriver, openTrip, seat, t, tashkent } from './g63-after-mock';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';

// docs/121 for the meeting and the end of the trip of the driver (G63 C3): at 320, 375 and 430 px
// nothing is cut, the page never scrolls sideways, one kind of element is one size.
const look = (page: Page, name: string, width: number) =>
  page.screenshot({ path: `screenshots/look/g63-after-${name}-${width}.png`, fullPage: true });

for (const width of WIDTHS) {
  test(`${width}px: «Uchrashuv» fits (docs/121)`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    const came = madina({ cameAt: tashkent('2026-10-07T07:40'), driverCameAt: tashkent('2026-10-07T07:41') });
    await openDriver(page, '2026-10-07T07:45', { trips: [live], bookings: [came] });
    await openTrip(page);
    await page.getByText(t('bookings.meeting.title')).click();
    await expect(page.getByText(t('driverAfter.meet.met'), { exact: true })).toBeVisible();
    await nothingCut(page);
    await oneSize(page, '.meet-tools button');
    await oneSize(page, '.meet-answer button');
    await look(page, 'meeting', width);
  });

  test(`${width}px: the past trip fits (docs/121)`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await page.route('**/api/reviews/*', (route) => route.fulfill({ json: fiveStars }));
    await openDriver(page, '2026-10-07T20:00', { trips: [pastTrip], bookings: pastSeats });
    await openTrip(page);
    await expect(page.getByText(/^Baho: ★★★★★/u)).toBeVisible();
    await nothingCut(page);
    await oneSize(page, '.past-rider-tool');
    await oneSize(page, '.past-after-row');
    await look(page, 'past', width);
  });

  test(`${width}px: «Safar tugadi» and «Qaytish» fit (docs/121)`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    const trip = mockupTrip({ price: 100000 });
    const seats = [seat(trip, '1', 'Madina', 2), seat(trip, '3', 'Sardor', 1)];
    await openDriver(page, '2026-10-07T20:00', { trips: [trip], bookings: seats });
    await openTrip(page);
    await page.getByText(t('driverAfter.past.rate')).click();
    await expect(page.getByText(t('driverAfter.done.rate'))).toBeVisible();
    await nothingCut(page);
    await oneSize(page, '.trip-end-stars button');
    await look(page, 'done', width);
    await page.locator('#tg-main-button').click();
    await expect(page.getByText(t('driverAfter.back.title'))).toBeVisible();
    await nothingCut(page);
    await look(page, 'back', width);
  });
}
