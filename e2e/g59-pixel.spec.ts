import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, openFindTrip, TEXT } from './apps';
import { noSeatYet } from './bookings-mock';
import { mapState, mockMap } from './map-mock';
import { mapDrawn, TILES_MS } from './map-wait';
import { MAN, mockupData } from './g59-pixel-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

// Pixel Perfect of G59 (lessons 141, 147): the code is shot at the size of the approved journey
// (docs/goals/g59/11-journey-passenger.png, 360 × 776), with the data of the mockup; the diff is read
// from the two pictures (scripts/pixel-diff.py).
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const CHILONZOR = '1726294';
const SAMARQAND = '1718401';
const OUT = 'screenshots/pixel-g59';
const MAP_HEIGHT = 718;
test.use({ viewport: { width: 360, height: 776 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

test('the search and «Safar» against the journey of the mockup', async ({ page }) => {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await noSeatYet(page);
  // «Qayerdan» of the mockup: Chilonzor, Toshkent.
  await page.addInitScript((id) => localStorage.setItem('here_district', id), CHILONZOR);
  // «Oxirgi joylar» of the mockup in Samarqand.
  const recent = (name: string, lat: number, lng: number) => ({
    point: { lat, lng },
    name: { step: 'landmark', name },
    district: SAMARQAND,
  });
  const places = [
    recent('Samarqand avtovokzali', 39.6681, 66.9367),
    recent('Siyob bozori', 39.6619, 66.9862),
  ];
  await page.addInitScript((kept) => localStorage.setItem('way_recent', kept), JSON.stringify(places));
  // The pin in Toshkent is «Grand», in Samarqand (south of 40°) «Registon maydoni».
  await page.route('**/api/passenger/map/where?*', (route) => {
    const lat = Number(new URL(route.request().url()).searchParams.get('at')?.split(',')[0]);
    const [district, name] = lat < 40 ? [SAMARQAND, 'Registon maydoni'] : [CHILONZOR, 'Grand'];
    return route.fulfill({ json: { district, name: { step: 'landmark', name }, area: null } });
  });
  await mockupData(page);
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port), 'android'));
  await openFindTrip(page);
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
  // «Qayerdan, qayerga?», its two maps and the page of the sent request (journey screens 7-10).
  await page.locator('#tg-main-button', { hasText: t('find.book', { count: '2' }) }).click();
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  await shot(page, '07');
  // The maps of the mockup stand under the header Telegram draws: their page is 58 px shorter.
  await page.setViewportSize({ width: 360, height: MAP_HEIGHT });
  await page.getByText(t('way.book.pickup')).click();
  await mapDrawn(page);
  await shot(page, '08');
  await pressBack(page);
  await page.getByText(t('way.book.dropoff')).click();
  await mapDrawn(page);
  await page.getByPlaceholder(t('way.point.search')).fill('Регистон');
  await page.getByText('Registon maydoni', { exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Registon maydoni yaqinida');
  await page.waitForTimeout(TILES_MS);
  await shot(page, '09');
  await page.setViewportSize({ width: 360, height: 776 });
  await page.locator('#tg-main-button', { hasText: t('way.point.takeTo') }).click();
  await page.locator('#tg-main-button', { hasText: t('bookings.send') }).click();
  await expect(page.getByText(t('bookings.status.requested')).first()).toBeVisible();
  await shot(page, '10');
});
