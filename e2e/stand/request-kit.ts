import { expect, type Locator, type Page } from '../crash-guard';
import { SLOW_MS } from '../map-wait';
import { mainButton, t } from './screen-tour';

// The map stands still and the name of the pin came: «Shu yerda» takes this place (lesson 77). The map
// is slow with four stands side by side (G77).
export async function mapReady(page: Page, title: 'way.point.from' | 'way.point.to') {
  await expect(page.getByText(t(title))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible({ timeout: SLOW_MS });
  // The name came and the map is inside the place (a center outside its border moves in, G35).
  await expect(page.getByRole('status')).not.toHaveText(/aniqlanmoqda|hududida emas/u, { timeout: SLOW_MS });
}

const ENDS = [
  [0, 'way.point.from'],
  [1, 'way.point.to'],
] as const;

// «Qayerdan, qayerga?» of a request (G61): an end not chosen yet opens its map, «Shu yerda» takes
// it; the way of the last request may be kept already (G35 K4). The map of the end opens by itself
// right after the start while the end is not chosen (G78 П4).
export async function fillEnds(
  page: Page,
  tap: (target: Locator) => Promise<void> = (target) => target.click(),
) {
  const points = page.getByText(t('bookings.points.title'));
  await expect(points).toBeVisible();
  for (const [index, title] of ENDS) {
    if (!(await page.getByText(t(title)).isVisible())) {
      const row = page.locator('.points-row').nth(index);
      if (!(await row.locator('.points-empty').isVisible())) continue;
      await tap(row);
    }
    await mapReady(page, title);
    await tap(mainButton(page));
    await expect(points.or(page.getByText(t('way.point.to')))).toBeVisible();
  }
  await expect(points).toBeVisible();
}
