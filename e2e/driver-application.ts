import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';
import { PHOTO } from './drivers-mock';

type Shot = (name: string) => Promise<unknown>;

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
  await shot('3-plate-empty');
  await page.getByPlaceholder(TEXT.platePlaceholder).fill('01 a 123 bc');
  await shot('3-plate');
  await mainButton.click();
  await page.getByText('4', { exact: true }).click();
  await page.locator('input[capture=user]').setInputFiles(PHOTO);
  await expect(mainButton).toBeVisible();
  await shot('4-avatar');
  await mainButton.click();
  await expect(page.getByText(TEXT.photoFront)).toBeVisible();
  await shot('5-photos-empty');
  for (const taken of [1, 2, 3]) {
    await page.getByText(TEXT.take).first().click();
    await page.locator('input[capture=environment]').setInputFiles(PHOTO);
    await expect(page.getByText(TEXT.retake)).toHaveCount(taken);
  }
  await expect(mainButton).toBeVisible();
  await expect(page.locator('.photo-frame img')).toHaveCount(3);
  await shot('5-photos');
  await mainButton.click();
  await expect(page.getByText('01 A 123 BC')).toBeVisible();
  await shot('6-review');
  await mainButton.click();
  await expect(page.getByText(TEXT.pending)).toBeVisible();
  await shot('7-pending');
}
