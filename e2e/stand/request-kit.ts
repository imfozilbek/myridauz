import { expect, type Locator, type Page } from '../crash-guard';
import { mainButton, t } from './screen-tour';

// The map stands still and the name of the pin came: «Shu yerda» takes this place (lesson 77).
export async function mapReady(page: Page, title: 'way.point.from' | 'way.point.to') {
  await expect(page.getByText(t(title))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  // The name came and the map is inside the place (a center outside its border moves in, G35).
  await expect(page.getByRole('status')).not.toHaveText(/aniqlanmoqda|hududida emas/u, { timeout: 15_000 });
}

const ENDS = [
  [0, 'way.point.from'],
  [1, 'way.point.to'],
] as const;

// «Qayerdan, qayerga?» of a request (G61): an end not chosen yet opens its map, «Shu yerda» takes
// it; the way of the last request may be kept already (G35 K4).
export async function fillEnds(
  page: Page,
  tap: (target: Locator) => Promise<void> = (target) => target.click(),
) {
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  for (const [index, title] of ENDS) {
    const row = page.locator('.points-row').nth(index);
    if (!(await row.locator('.points-empty').isVisible())) continue;
    await tap(row);
    await mapReady(page, title);
    await tap(mainButton(page));
    await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  }
}
