import { test, type Page } from './crash-guard';
import { openDriverHome } from './g66-driver-mock';
import { openPassengerHome } from './g66-home-mock';

// Pixel Perfect of the main screens of G76 (lessons 141, 147): the phones of goals/g76 at the window
// of Telegram (360 × 720) and the scale 1.5, with the data of the mockups; scripts/pixel-diff.py reads
// the difference (docs/167).
const OUT = 'screenshots/pixel-g76';
test.use({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 1.5 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

test('1-home-passenger: the parts of the main screen', async ({ page }) => {
  await openPassengerHome(page);
  await page.waitForLoadState('networkidle');
  await shot(page, '1-home-passenger');
});

test('1-home-driver: the parts of the main screen', async ({ page }) => {
  await openDriverHome(page, 'free');
  await page.waitForLoadState('networkidle');
  await shot(page, '1-home-driver');
});
