import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { expect, test, type Page } from './crash-guard';
import { openMockupProfile } from './g65-profile-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of «Profil, hujjatlar va shikoyat» (G75, lessons 141, 147): the phones of g75/5 A at
// the size of the mockup (360 × 760 at 1) with Jasur of the mockup.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const OUT = 'screenshots/pixel-g75';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
// Jasur of the mockup: 24 ratings, 31 trips, 96% on time, 473 000 soʻm of bonus.
const jasur = (page: Page) => async () => {
  await page.route('**/api/me', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          json: {
            state: 'active',
            profile: {
              id: '00000000000000000000000000000001',
              firstName: 'Jasur',
              gender: 'male',
              phone: '+998901110112',
              roles: ['driver'],
              hasAvatar: true,
              writeAccess: true,
              joinedAt: Date.parse('2026-08-01T10:00:00+05:00'),
              rating: 4.9,
              avatarStatus: 'approved',
              avatarReason: null,
            },
          },
        })
      : route.fallback(),
  );
  await page.route('**/api/driver/standing', (route) =>
    route.fulfill({ json: { rating: { average: 4.9, count: 24 }, onTime: 96, trips: 31 } }),
  );
  await page.route('**/api/driver/application', (route) =>
    route.fulfill({
      json: {
        application: {
          status: 'approved',
          car,
          photos: { front: true, side: true, interior: true },
          reasons: [],
        },
      },
    }),
  );
  await page.route('**/api/driver/wallet', (route) =>
    route.fulfill({
      json: { bonus: 473_000, main: 0, bonusExpiresAt: null, seatsLeft: null, operations: [] },
    }),
  );
};

test('5-1: «Ommaviy oferta»', async ({ page }) => {
  await openMockupProfile(page, 'passenger');
  await page.getByText(t('account.profile.documents')).click();
  await page.getByText(t('legal.offer.title')).click();
  await expect(page.getByText(/^Tahrir /u)).toBeVisible();
  await shot(page, '5-1');
});

test('5-2: «Yoʻlovchilar sizni shunday koʻradi»', async ({ page }) => {
  await openMockupProfile(page, 'driver', [], jasur(page));
  await page.getByText(/meni qanday koʻradi/u).click();
  await expect(page.locator('.look-stats')).toHaveText(/24/u);
  await shot(page, '5-2');
});

test('5-3: «Maʼlumotlaringiz oʻchirilsinmi?» of a driver with a bonus', async ({ page }) => {
  await openMockupProfile(page, 'driver', [], jasur(page));
  await page.getByText(t('account.delete.open')).click();
  await expect(page.locator('.delete-wallet')).toBeVisible();
  await shot(page, '5-3');
});

test('5-4: «Shikoyat» with two reasons', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?complain=b1`));
  await page.getByText(t('complaints.reason.unsafe_driving')).click();
  await page.getByText(t('complaints.reason.price_changed')).click();
  await shot(page, '5-4');
});
