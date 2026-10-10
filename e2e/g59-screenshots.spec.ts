import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, openFindTrip, TEXT } from './apps';
import { noSeatYet } from './bookings-mock';
import { mapState, mockMap } from './map-mock';
import { mapDrawn, TILES_MS } from './map-wait';
import { fromIfAsked } from './market';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';
import { mockTelegram, telegramUrl } from './telegram-mock';

// G59 (docs/118 path 2): every new screen of the search and the booking on Android and iOS, at the
// narrow, the usual and the wide phone; nothing is cut and cards of one kind are of one size (docs/121).
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const PLATFORMS = ['android', 'ios'] as const;
const mainButton = (page: Page) => page.locator('#tg-main-button');

for (const platform of PLATFORMS)
  for (const width of WIDTHS)
    test(`${platform} ${width}px: the search and the booking of G59`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: HEIGHT });
      await mockApi(page, 'active');
      await mockMap(page, mapState());
      await noSeatYet(page);
      await mockTelegram(page);
      await page.goto(telegramUrl(appUrl(PASSENGER.port), platform));
      const shot = async (name: string, check = true) => {
        if (check) await nothingCut(page);
        await page.mouse.move(0, 0);
        await page.screenshot({ path: `screenshots/g59/${platform}-${width}-${name}.png`, fullPage: true });
      };
      await openFindTrip(page);
      await fromIfAsked(page);
      await expect(page.locator('.direction-card').first()).toBeVisible();
      await oneSize(page, '.direction-card');
      await shot('01-directions');
      await page.getByText(TEXT.otherPlace).click();
      await page.getByPlaceholder(TEXT.otherPlace).fill('Samar');
      await expect(page.getByText('Samarqand shahri', { exact: true })).toBeVisible();
      await shot('02-other-place');
      await page.getByText('Samarqand shahri', { exact: true }).click();
      await expect(page.locator('.search-trip').first()).toBeVisible();
      await oneSize(page, '.day-count');
      await shot('03-trips');
      await page.locator('.search-trip').first().click();
      await expect(page.getByText(t('find.seatsTitle'))).toBeVisible();
      await shot('04-safar');
      await page.getByLabel(t('market.price.more')).click();
      await mainButton(page)
        .filter({ hasText: t('find.book', { count: '2' }) })
        .click();
      await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
      await shot('05-points');
      await page.getByText(t('way.book.pickup')).click();
      await mapDrawn(page);
      await shot('06-pickup', false);
      await mainButton(page)
        .filter({ hasText: t('way.point.takeFrom') })
        .click();
      await page.getByText(t('way.book.dropoff')).click();
      await mapDrawn(page);
      await page.getByPlaceholder(t('way.point.search')).fill('Регистон');
      await page.getByText('Registon maydoni', { exact: true }).click();
      await expect(page.getByRole('status')).toHaveText('Registon maydoni yaqinida');
      await page.waitForTimeout(TILES_MS);
      await shot('07-dropoff', false);
      await mainButton(page)
        .filter({ hasText: t('way.point.takeTo') })
        .click();
      await expect(page.getByText(t('bookings.points.all'))).toBeVisible();
      await shot('08-review');
      await mainButton(page)
        .filter({ hasText: t('bookings.send') })
        .click();
      await expect(page.getByText(t('bookings.status.requested')).first()).toBeVisible();
      await shot('09-pending');
    });
