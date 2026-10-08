import { channelOf, loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openTripAt, type Moment } from './g63-pixel-mock';
import { mapState, mockMap } from './map-mock';
import { TILES_MS } from './map-wait';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';

// Pixel Perfect of «Mening safarim» (G63, lessons 141, 147, 160): the phones of g63/3-trip.png (scale
// 1.5) and the screens of g63/4 and g63/5 (scale 1.25) at the size and scale of the mockup, with the
// data of the mockup; numbered-diff.py reads the diff. Then docs/121 at 320, 375 and 430 px: nothing
// is cut, one kind is one size.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g63';
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

const PUBLISHED = '2026-10-06T14:20';
const SOON = '2026-10-07T07:30';
const ON_WAY = '2026-10-07T08:10';
const PHONES = [
  ['3-1', PUBLISHED, false, t('driverTrip.published.title')],
  ['3-2', SOON, true, t('driverTrip.soon.title', { minutes: '30' })],
  ['3-3', ON_WAY, true, t('driverTrip.onWay.title')],
] as const;

// The channel of Samarqand as the server gives it (its zone title, docs/63) with the number of the
// mockup g59/7-channels-3 phone 1: the people who opened the trip instead of the subscribers (owner
// decision 08.10.2026, docs/119).
const SAMARQAND = '1718401';
const channel = channelOf(loadBrand(), SAMARQAND);
const PUBLICITY = {
  channels: [{ username: channel?.username, title: channel?.title, posted: true }],
  views: 3200,
  link: 'https://t.me/test_bot?startapp=trip_7__driver',
};

type Phone = {
  readonly name: string;
  readonly scale: number;
  readonly height: number;
  readonly now: string;
  readonly full: boolean;
  readonly moment?: Moment;
};
const ON_WAY_MOMENT = { departed: true };
const SHOTS: readonly Phone[] = [
  { name: '3-trip-1', scale: 1.5, height: 760, now: PUBLISHED, full: false },
  { name: '3-trip-2', scale: 1.5, height: 760, now: SOON, full: true },
  { name: '3-trip-3', scale: 1.5, height: 760, now: ON_WAY, full: true, moment: ON_WAY_MOMENT },
  { name: 'journey-06', scale: 1.25, height: 759, now: PUBLISHED, full: false },
  { name: 'journey-11', scale: 1.25, height: 759, now: SOON, full: true },
  { name: 'journey-14', scale: 1.25, height: 761, now: ON_WAY, full: true, moment: ON_WAY_MOMENT },
  {
    name: 'after-01',
    scale: 1.25,
    height: 759,
    now: '2026-10-07T07:46',
    full: true,
    moment: { noShow: true },
  },
];

for (const { name, scale, height, now, full, moment } of SHOTS)
  test.describe(`${name}: 360 × ${height} at the scale of the mockup`, () => {
    test.use({ viewport: { width: 360, height }, deviceScaleFactor: scale });
    test('the page', async ({ page }) => {
      await openTripAt(page, now, full, moment);
      // The plate on top is there: the stage of the trip, or «Akmal kelmadi».
      await expect(page.locator('.own-banner, .no-show-banner')).toBeVisible();
      await shot(page, name);
    });
  });

test.describe('journey-12: the map of the way from the tile', () => {
  test.use({ viewport: { width: 360, height: 759 }, deviceScaleFactor: 1.25 });
  test('the map', async ({ page }) => {
    await mockMap(page, mapState());
    await openTripAt(page, SOON, true);
    await page.getByText(t('driverTrip.tile.map')).click();
    await expect(page.locator('.trip-map-box[data-state="ready"]')).toBeVisible();
    await page.waitForTimeout(TILES_MS);
    await shot(page, 'journey-12');
  });
});

// The card of the mockup is 332 px wide (its page has 14 px sides, ours 12): the shot is as wide.
const CHANNEL_PAGE = 356;
test.describe('the trip in the channel at the scale of g59/7-channels-3', () => {
  test.use({ viewport: { width: CHANNEL_PAGE, height: 760 }, deviceScaleFactor: 1.5 });
  test('the card', async ({ page }) => {
    await openTripAt(page, PUBLISHED, false, { publicity: PUBLICITY });
    const card = page.locator('.own-channel');
    await card.screenshot({ path: `${OUT}/channel-code.png`, animations: 'disabled' });
  });
});

// The link of the trip stays on one line at the width of the mockup (g59/7-channels-3 phone 1).
for (const width of [360, ...WIDTHS])
  test(`${width}px: «Havolani yoʻlovchilarga yuborish» is one line`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await openTripAt(page, PUBLISHED, false, { publicity: PUBLICITY });
    const text = page.locator('.own-channel-share span');
    await expect(text).toHaveText(t('driverTrip.channel.share'));
    const lines = await text.evaluate((span) => {
      const range = document.createRange();
      range.selectNodeContents(span);
      return new Set([...range.getClientRects()].map((box) => Math.round(box.top))).size;
    });
    expect(lines).toBe(1);
    await nothingCut(page);
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
