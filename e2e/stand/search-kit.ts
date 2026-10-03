import { expect, type Page } from '@playwright/test';
import { t } from './screen-tour';

// The search of a passenger on the short path (G35, docs/97 K1): the list of the end opens at once;
// the start is the place of the person, or Chilonzor when the phone does not tell it. Both chosen,
// the trips of the nearest day open without «Davom etish».
export async function searchTo(page: Page, region: string, place: string) {
  await page.getByAltText(region).click();
  await page.getByText(place, { exact: true }).click();
  const start = page.getByAltText('Toshkent shahri');
  await expect(start.or(page.getByText(t('market.date.otherDay')))).toBeVisible();
  if (!(await start.isVisible())) return;
  await start.click();
  await page.getByText('Chilonzor').click();
}
