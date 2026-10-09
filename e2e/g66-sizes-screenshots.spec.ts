import { test } from './crash-guard';
import { openDriverHome } from './g66-driver-mock';
import { openPassengerHome } from './g66-home-mock';
import { HEIGHT, nothingCut, oneHeight, WIDTHS } from './sizes';

const SHOTS = 'screenshots/look';

// docs/121 on narrow and wide phones (G66): the main screens of both roles in every state of the
// mockups g66/1 and g66/2; nothing is cut, the tiles keep one height, the wide one too.
for (const width of WIDTHS) {
  for (const state of ['quiet', 'trip'] as const) {
    test(`${width}px: the main screen of a passenger, ${state}`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await openPassengerHome(page, state);
      await page.waitForLoadState('networkidle');
      await nothingCut(page);
      await oneHeight(page, '.home-tile');
      await page.screenshot({ path: `${SHOTS}/g66-passenger-${state}-${width}.png`, fullPage: true });
    });
  }

  for (const state of ['pending', 'free', 'tomorrow', 'today'] as const) {
    test(`${width}px: the main screen of a driver, ${state}`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await openDriverHome(page, state);
      await page.waitForLoadState('networkidle');
      await nothingCut(page);
      await oneHeight(page, '.home-tile');
      await page.screenshot({ path: `${SHOTS}/g66-driver-${state}-${width}.png`, fullPage: true });
    });
  }
}
