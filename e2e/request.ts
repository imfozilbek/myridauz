import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { openFindTrip } from './apps';
import { takeEnd } from './bookings';
import { MAN } from './g59-pixel-mock';
import { tripOf } from './market-mock';
import { fromIfAsked, searchRoute } from './market';

const { t } = createI18n(DEFAULT_LOCALE);
type Body = Record<string, unknown>;
const mainButton = (page: Page) => page.locator('#tg-main-button');

// What the app sent to a path: the body of the last POST (G61).
function sentTo(page: Page, path: string) {
  const bodies: Body[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith(path))
      bodies.push(request.postDataJSON() as Body);
  });
  return bodies;
}

// No trip on the day: «Soʻrov qoldirish», the request on one screen with «Men bilan ayol bor» and
// «Boʻsh salon kerak», then «Mening soʻrovim» at once (G61, docs/118 path 4).
export async function leaveRequest(page: Page, open: () => Promise<unknown>) {
  // «Men bilan ayol bor» is a man's (docs/06 rule 4).
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
  await page.route('**/api/trips?*', (route) => route.fulfill({ json: { trips: [] } }));
  const bodies = sentTo(page, '/passenger/requests');
  await open();
  await openFindTrip(page);
  await searchRoute(page);
  await page.getByRole('button', { name: t('market.request.publish') }).click();
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  await takeEnd(page, 'pickup');
  await takeEnd(page, 'dropoff', ['Регистон', 'Registon maydoni']);
  await page.getByLabel(t('market.price.more')).first().click();
  await page.getByText(t('find.withWoman')).click();
  await page.getByText(t('market.request.wholeCar')).click();
  await mainButton(page)
    .filter({ hasText: t('market.request.publish') })
    .click();
  await expect(page.getByText(t('market.request.cancel'))).toBeVisible();
  return bodies;
}

// A trip that sells the whole car: «Butun salon» on «Safar», then the two ends (G59, G61).
export async function bookWholeCar(page: Page, open: () => Promise<unknown>) {
  const trip = tripOf('5', 'Jasur', false, 26, { bookingRule: 'seats_or_car', seats: 4, seatsLeft: 4 });
  await page.route('**/api/trips?*', (route) => route.fulfill({ json: { trips: [trip] } }));
  const bodies = sentTo(page, '/bookings');
  await open();
  await openFindTrip(page);
  await fromIfAsked(page);
  await searchRoute(page);
  await page.getByText('Jasur', { exact: false }).first().click();
  await page.getByRole('tab', { name: t('find.wholeCar') }).click();
  await mainButton(page)
    .filter({ hasText: t('find.bookCar') })
    .click();
  await takeEnd(page, 'pickup');
  await takeEnd(page, 'dropoff', ['Регистон', 'Registon maydoni']);
  await mainButton(page)
    .filter({ hasText: t('bookings.send') })
    .click();
  await expect(page.getByText(t('bookings.status.requested')).first()).toBeVisible();
  return bodies;
}
