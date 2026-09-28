import { loadBrand } from '@platform/brands';
import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;
// Any real picture works: the Mini App compresses it before the upload.
const PHOTO = `brands/${loadBrand().id}/public/regions/1726.webp`;

// Goes through the driver application like a person: one answer per screen (G06).
export async function applyAsDriver(page: Page, shot: Shot = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(TEXT.becomeDriver)).toBeVisible();
  await shot('1-intro');
  await mainButton.click();
  await expect(page.getByText('Chevrolet')).toBeVisible();
  await shot('2-make');
  await page.getByText('Chevrolet').click();
  await page.getByText('Cobalt').click();
  await page.getByText('Oq', { exact: true }).click();
  await page.getByText('2021', { exact: true }).click();
  await page.getByPlaceholder(TEXT.plateHint).fill('01 a 123 bc');
  await shot('3-plate');
  await mainButton.click();
  await page.getByText('4', { exact: true }).click();
  await page.locator('input[capture=user]').setInputFiles(PHOTO);
  await expect(mainButton).toBeVisible();
  await shot('4-avatar');
  await mainButton.click();
  for (const kind of [TEXT.photoFront, TEXT.photoSide, TEXT.photoInterior]) {
    await page.getByText(kind).click();
    await page.locator('input[capture=environment]').setInputFiles(PHOTO);
  }
  await expect(mainButton).toBeVisible();
  await shot('5-photos');
  await mainButton.click();
  await expect(page.getByText('01 A 123 BC')).toBeVisible();
  await shot('6-review');
  await mainButton.click();
  await expect(page.getByText(TEXT.pending)).toBeVisible();
  await shot('7-pending');
}
