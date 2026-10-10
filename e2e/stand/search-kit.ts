import { expect, type Page } from '@playwright/test';
import { t } from './screen-tour';

// The search of a passenger (G59, docs/118 path 2): «Qayerdan» is the place of the person, or
// Chilonzor when the phone does not tell it; then the place by «Boshqa joy: tuman yoki shahar», and
// the trips of the nearest day with trips open at once. The block at the bottom keeps the last
// route (G76, docs/165): «Safar topish» may open the trips to this place at once.
export async function searchTo(page: Page, place: string) {
  const asked = page.getByText(t('places.fromTitle'));
  const found = page.getByRole('heading', { name: new RegExp(`→ ${place}$`, 'u') });
  await expect(asked.or(page.getByText(t('find.title'))).or(found)).toBeVisible();
  if (await found.isVisible()) return;
  if (await asked.isVisible()) {
    await page.getByAltText('Toshkent shahri').click();
    await page.getByText('Chilonzor').click();
  }
  await page.getByText(t('find.other')).click();
  await page.getByPlaceholder(t('find.other')).fill(place.slice(0, 4));
  // Only the list of the sheet: the card of the region behind it may have the same name.
  await page.getByRole('dialog').getByText(place, { exact: true }).click();
}
