import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, type Page } from './crash-guard';

const { t } = createI18n(DEFAULT_LOCALE);
// The map draws without a graphics card on a busy CI runner: the name under the pin can come later
// than the usual 5 s there (lesson 157). The tiles then need a moment to show on the picture.
const PLACE_FOUND_MS = 20_000;
export const TILES_MS = 1500;

// The name under the pin came: «Shu yerda» waits for it (lesson 77).
export const placeFound = (page: Page) =>
  expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'), { timeout: PLACE_FOUND_MS });

// The map is drawn and its place is found: ready for a picture.
export async function mapDrawn(page: Page) {
  await expect(page.locator('[data-state="ready"]').first()).toBeVisible();
  await placeFound(page);
  await page.waitForTimeout(TILES_MS);
}
