import type { Page } from '@playwright/test';
import { channelOf, loadBrand } from '@platform/brands';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { MAN } from './g59-pixel-mock';
import { mapState, mockMap } from './map-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of G61 (lessons 141, 147): the request of the mockup (docs/goals/g61/1-request.png,
// the phone at 360 × 759), with its data: Yunusobod → Urganch today, 2 people, 300 000 a seat.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const YUNUSOBOD = '1726266';
const URGANCH = '1733217';
const OUT = 'screenshots/pixel-g61';
test.use({ viewport: { width: 360, height: 759 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

// The way of the last time on this route: «Amir Temur xiyoboni» and «Urganch shahri» (docs/97 K4).
const WAY = [
  {
    route: `${YUNUSOBOD}:${URGANCH}`,
    mode: 'door',
    pickup: {
      place: YUNUSOBOD,
      point: { lat: 41.31, lng: 69.28 },
      name: { step: 'street', name: 'Amir Temur xiyoboni' },
    },
    dropoff: {
      place: URGANCH,
      point: { lat: 41.55, lng: 60.63 },
      name: { step: 'district', name: 'Urganch shahri' },
    },
  },
];

async function mockRequestData(page: Page) {
  const recommendation = { from: YUNUSOBOD, to: URGANCH, km: 1000, price: 300000, source: 'formula' };
  await page.route('**/api/prices/recommendation?*', (route) =>
    route.fulfill({ json: { ...recommendation, minPrice: 30000, maxPrice: 600000, roundStep: 5000 } }),
  );
  await page.route('**/api/pitaks/direction?*', (route) => route.fulfill({ json: { pitak: null } }));
  await page.route('**/api/trips/directions?*', (route) => route.fulfill({ json: { directions: [] } }));
  const days = [0, 1, 2, 3, 4, 5, 6].map((index) => ({
    date: tashkentDate(Date.now() + index * DAY_MS),
    trips: 0,
  }));
  await page.route('**/api/trips/days?*', (route) => route.fulfill({ json: { km: 1000, days } }));
  await page.route('**/api/trips?*', (route) => route.fulfill({ json: { trips: [] } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
}

test('«Soʻrov» against the mockup', async ({ page }) => {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await mockRequestData(page);
  await page.addInitScript((id) => localStorage.setItem('here_district', id), YUNUSOBOD);
  await page.addInitScript((way) => localStorage.setItem('book_points', way), JSON.stringify(WAY));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port), 'android'));
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await page.getByText(TEXT.otherPlace).click();
  await page.getByPlaceholder(TEXT.otherPlace).fill('Urg');
  await page.getByRole('dialog').getByText('Urganch', { exact: true }).click();
  await page.getByRole('button', { name: t('market.request.publish') }).click();
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  await page.getByLabel(t('market.price.more')).first().click();
  await page.getByText(t('find.withWoman')).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '01');
});

// «Mening soʻrovim» of the mockup (docs/goals/g61/3-offers.png): two offers, the whole car asked.
const tomorrow = () => tashkentDate(Date.now() + DAY_MS);
const asked = () => ({
  id: 'r1',
  passenger: { id: MAN.id, firstName: MAN.firstName, hasAvatar: false },
  from: YUNUSOBOD,
  to: URGANCH,
  date: tomorrow(),
  km: 1000,
  seats: 2,
  price: 300000,
  pickupMode: 'door',
  wholeCar: true,
  withWoman: false,
  status: 'open',
});
const offerOf = (
  id: string,
  name: string,
  model: string,
  color: string,
  plate: string,
  time: string,
  price: number,
) => ({
  id,
  requestId: 'r1',
  driver: {
    id: `0000000000000000000000000000000${id}`,
    firstName: name,
    hasAvatar: false,
    car: { make: 'Chevrolet', model, color, plate },
    rating: { average: 4.9, count: 30 },
  },
  from: YUNUSOBOD,
  to: URGANCH,
  departAt: Date.parse(`${tomorrow()}T${time}:00+05:00`),
  km: 1000,
  seats: 4,
  wholeCar: true,
  price,
  commission: 0,
  status: 'sent',
  bookingId: null,
  chatKey: `o00000000-0000-4000-8000-00000000000${id}`,
});

test('«Mening soʻrovim» against the mockup', async ({ page }) => {
  await mockApi(page, 'active');
  await mockRequestData(page);
  // The mockup has no channel block: the channel of Xorazm was closed before (docs/119).
  const closed = JSON.stringify([channelOf(loadBrand(), URGANCH)?.username]);
  await page.addInitScript((kept) => localStorage.setItem('channel_offered', kept), closed);
  await page.route('**/api/passenger/requests', (route) => route.fulfill({ json: { requests: [asked()] } }));
  await page.route('**/api/passenger/bookings', (route) => route.fulfill({ json: { bookings: [] } }));
  const offers = [
    offerOf('1', 'Jasur', 'Cobalt', 'white', '01A123BC', '08:30', 280000),
    offerOf('2', 'Bobur', 'Nexia 3', 'gray', '01B456CD', '11:00', 300000),
  ];
  await page.route('**/api/passenger/offers', (route) => route.fulfill({ json: { offers } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port), 'android'));
  await page.getByText(t('common.myTrips')).click();
  await page.locator('.trip-card').first().click();
  await expect(page.getByText(t('bookings.request.offers', { count: '2' }))).toBeVisible();
  await page.waitForLoadState('networkidle');
  await shot(page, '03');
});
