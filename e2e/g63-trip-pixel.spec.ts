import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openTripAt } from './g63-pixel-mock';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';

// Pixel Perfect of «Mening safarim» (G63, lessons 141, 147, 160): the three phones of g63/3-trip.png
// at the size of the mockup phones (360 × 760) with the data of the mockup; scripts/pixel-diff.py
// reads the diff. Then docs/121 at 320, 375 and 430 px: nothing is cut, one kind is one size.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g63';
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

const PHONES = [
  ['3-1', '2026-10-06T14:20', false, t('driverTrip.published.title')],
  ['3-2', '2026-10-07T07:30', true, t('driverTrip.soon.title', { minutes: '30' })],
  ['3-3', '2026-10-07T08:10', true, t('driverTrip.onWay.title')],
] as const;

test.describe('360 × 760, the phones of the mockup', () => {
  test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });
  for (const [name, now, full, banner] of PHONES)
    test(`${name}: ${banner}`, async ({ page }) => {
      await openTripAt(page, now, full);
      await expect(page.getByText(banner)).toBeVisible();
      await shot(page, name);
    });
});

for (const width of WIDTHS)
  for (const [name, now, full] of PHONES)
    test(`${width}px: «Mening safarim» ${name} fits (docs/121)`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await openTripAt(page, now, full);
      await nothingCut(page);
      // One kind is one size: the buttons of the requests, the passengers with their tools.
      await oneSize(page, full ? '.rider-tool' : '.seat-card-buttons button');
      if (full) await oneSize(page, '.rider-row');
      // The tiles stand in one row of one height; the first is wider while its word needs it (mockup).
      const heights = await page
        .locator('.own-tile')
        .evaluateAll((tiles) => tiles.map((tile) => tile.clientHeight));
      expect(new Set(heights).size).toBe(1);
      // A line under a name breaks only after «·»: no part of it is broken in two.
      const broken = await page
        .locator('.line-part')
        .evaluateAll(
          (parts) =>
            parts.filter((part) => part.clientHeight > parseFloat(getComputedStyle(part).lineHeight) + 1)
              .length,
        );
      expect(broken).toBe(0);
      await page.screenshot({ path: `screenshots/look/g63-trip-${name}-${width}.png`, fullPage: true });
    });
