import { test } from './crash-guard';
import { openMyRequest, openRequestScreen } from './g61-mock';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';

// docs/121 on narrow and wide phones (G61): the request and «Mening soʻrovim» with the channel
// while waiting: nothing is cut, the buttons of the offers are of one size.
for (const width of WIDTHS) {
  test(`${width}px: «Soʻrov» fits`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await openRequestScreen(page);
    await nothingCut(page);
    await page.screenshot({ path: `screenshots/look/g61-request-${width}.png`, fullPage: true });
  });

  test(`${width}px: «Mening soʻrovim» fits`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await openMyRequest(page, true);
    await nothingCut(page);
    await oneSize(page, '.offer-card-answers button');
    await page.screenshot({ path: `screenshots/look/g61-mine-${width}.png`, fullPage: true });
  });
}
