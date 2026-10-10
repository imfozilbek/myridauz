import { test, type Page } from './crash-guard';
import { openDriverShot } from './g76-driver-mock';
import { openPassengerShot } from './g76-passenger-mock';

// Pixel Perfect of the main screens of G76 (lessons 141, 147): the phones of goals/g76 at the window
// of Telegram (360 × 720) and the scale 1.5, with the data of the mockups; scripts/pixel-diff.py reads
// the difference (docs/167).
const OUT = 'screenshots/pixel-g76';
test.use({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 1.5 });

const shot = async (page: Page, name: string) => {
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
};

const PASSENGER_PHONES = 15;
const DRIVER_PHONES = 16;
for (let phone = 1; phone <= PASSENGER_PHONES; phone++)
  test(`2-passenger-${phone}: the block of the mockup g76/2`, async ({ page }) => {
    await openPassengerShot(page, phone);
    await shot(page, `2-passenger-${phone}`);
  });

for (let phone = 1; phone <= DRIVER_PHONES; phone++)
  test(`3-driver-${phone}: the block of the mockup g76/3`, async ({ page }) => {
    await openDriverShot(page, phone);
    await shot(page, `3-driver-${phone}`);
  });

// g76/1: the sizes of the phones (owner decision 10.10.2026): the width sets the tiles, a low window
// makes them smaller. [phone, role, shot, width, height]
const SIZES = [
  [3, 'driver', 17, 320, 700],
  [4, 'passenger', 10, 360, 720],
  [5, 'passenger', 16, 393, 740],
  [6, 'driver', 17, 430, 830],
  [7, 'passenger', 10, 360, 640],
] as const;
for (const [phone, role, data, width, height] of SIZES)
  test.describe(() => {
    test.use({ viewport: { width, height } });
    test(`1-home-${phone}: ${width} × ${height}`, async ({ page }) => {
      await (role === 'driver' ? openDriverShot(page, data) : openPassengerShot(page, data));
      await shot(page, `1-home-${phone}`);
    });
  });

// g76/4: the sheets rise over the block only from its button or its red dot (docs/164).
const SHEETS = [
  [1, 'driver', 7, null],
  [2, 'driver', 7, 'main'],
  [3, 'passenger', 5, null],
  [4, 'passenger', 5, 'main'],
  [5, 'passenger', 9, null],
  [6, 'passenger', 9, 'dot'],
] as const;
test.describe('the sheets', () => {
  // The sheets stay for the picture (crash-guard answers «later» on them by default).
  test.use({ actionSheets: 'keep' });
  for (const [phone, role, data, tap] of SHEETS)
    test(`4-sheets-${phone}: the block and its sheet`, async ({ page }) => {
      await (role === 'driver' ? openDriverShot(page, data) : openPassengerShot(page, data));
      // The block shows its thing once the lists came.
      await page.locator('.dock-card').waitFor();
      if (tap) {
        await page.locator(tap === 'main' ? '#tg-main-button' : '.dock-tool:has(.dock-tool-dot)').click();
        await page.locator('.action-kicker').first().waitFor();
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      await shot(page, `4-sheets-and-priority-${phone}`);
    });
});
