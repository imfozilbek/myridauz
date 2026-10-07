import type { Page } from '@playwright/test';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { noSeatYet } from './bookings-mock';
import { mapState, mockMap } from './map-mock';
import { tripOf } from './market-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

// Pixel Perfect of G59 (lessons 141, 147): the code is shot at the size of the approved journey
// (docs/goals/g59/11-journey-passenger.png, 360 × 776), with the data of the mockup; the diff is read
// from the two pictures (scripts/pixel-diff.py).
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const CHILONZOR = '1726294';
const OUT = 'screenshots/pixel-g59';
const TILES_MS = 1500;
const MAN = {
  id: '00000000000000000000000000000001',
  firstName: 'Aziz',
  gender: 'male',
  phone: '+998901234567',
  roles: ['passenger'],
  hasAvatar: true,
  writeAccess: false,
  rating: null,
  avatarStatus: null,
  avatarReason: null,
};
test.use({ viewport: { width: 360, height: 776 }, deviceScaleFactor: 1 });

// The numbers of the journey: 4 cards, the days 3, 8 and 5 trips.
async function mockupCounts(page: Page) {
  const card = (to: string, today: number, tomorrow: number, price: number) => ({
    to,
    today,
    tomorrow,
    price,
  });
  await page.route('**/api/trips/directions?*', (route) =>
    route.fulfill({
      json: {
        directions: [
          card('1718', 3, 8, 90000),
          card('1730', 2, 5, 100000),
          card('1706', 1, 4, 160000),
          card('1703', 0, 3, 110000),
        ],
      },
    }),
  );
  const counts = [3, 8, 5, 0, 0, 0, 0];
  const days = counts.map((trips, index) => ({ date: tashkentDate(Date.now() + index * DAY_MS), trips }));
  await page.route('**/api/trips/days?*', (route) => route.fulfill({ json: { km: 300, days } }));
  // «Ertaga» of the mockup: 08:00 and 13:00, two trips of one seat hidden by «2» people.
  const tomorrow = tashkentDate(Date.now() + DAY_MS);
  const at = (time: string) => ({ departAt: Date.parse(`${tomorrow}T${time}:00+05:00`) });
  const nodira = tripOf('2', 'Nodira', true, 0, { ...at('13:00'), seatsLeft: 2 });
  const trips = [
    tripOf('1', 'Jasur', false, 0, at('08:00')),
    { ...nodira, driver: { ...nodira.driver, rating: { average: 4.8, count: 23 } } },
    tripOf('3', 'Bekzod', false, 0, { ...at('15:00'), seatsLeft: 1 }),
    tripOf('4', 'Akmal', false, 0, { ...at('17:00'), seatsLeft: 1 }),
  ];
  await page.route('**/api/trips?*', (route) => route.fulfill({ json: { trips } }));
  const review = { id: 'r1', authorName: 'Dilshod', stars: 5, tags: [], at: Date.now() };
  await page.route('**/api/users/*/reviews', (route) =>
    route.fulfill({
      json: {
        rating: { average: 4.8, count: 23 },
        reviews: [{ ...review, text: 'Vaqtida keldi, yoʻlda xavfsiz haydadi.' }],
      },
    }),
  );
}

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

test('the search and «Safar» against the journey of the mockup', async ({ page }) => {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await noSeatYet(page);
  // «Qayerdan» of the mockup: Chilonzor, Toshkent.
  await page.addInitScript((id) => localStorage.setItem('here_district', id), CHILONZOR);
  await page.route('**/api/passenger/map/where?*', (route) =>
    route.fulfill({ json: { district: CHILONZOR, name: { step: 'landmark', name: 'Grand' }, area: null } }),
  );
  await mockupCounts(page);
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port), 'android'));
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await expect(page.locator('.direction-card').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  await shot(page, '03');
  await page.getByText(TEXT.otherPlace).click();
  await page.getByPlaceholder(TEXT.otherPlace).fill('Urg');
  await expect(page.getByRole('dialog').getByText('ut', { exact: false }).first()).toBeVisible();
  await shot(page, '04');
  await pressBack(page);
  await page.locator('.direction-card').first().click();
  await expect(page.locator('.search-trip').first()).toBeVisible();
  await page.getByRole('tab').nth(1).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '05');
  // «Safar» of the mockup with «Men bilan ayol bor»: the man (MAN) looks at a trip without the mark.
  await page.locator('.search-trip').first().click();
  await expect(page.getByText(t('find.seatsTitle'))).toBeVisible();
  await page.getByLabel(t('market.price.more')).click();
  await page.getByText(t('find.withWoman')).click();
  await expect(page.locator('.area-map-box[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '06');
});
