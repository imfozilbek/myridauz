import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;

// Our camera screen is open and the fake camera shows a picture.
async function cameraReady(page: Page) {
  const shutter = page.getByRole('dialog').getByLabel(TEXT.shutter);
  await expect(shutter).toBeEnabled();
}

// Goes through the driver application like a person: one answer per screen (G06).
export async function applyAsDriver(page: Page, shot: Shot = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(TEXT.becomeDriver)).toBeVisible();
  await shot('1-intro');
  await mainButton.click();
  await expect(page.getByText('Chevrolet')).toBeVisible();
  await shot('2-make');
  await page.getByText('Chevrolet').click();
  await page.getByText('Damas').click();
  await expect(page.locator('.car-swatch')).toHaveCount(10);
  await shot('2-color');
  await page.getByText('Oq', { exact: true }).click();
  await shot('3-plate-empty');
  await page.getByLabel(TEXT.plateField).fill('01a1');
  await shot('3-plate-typing');
  await page.getByLabel(TEXT.plateField).fill('011');
  await shot('3-plate-company');
  await page.getByLabel(TEXT.plateField).fill('01 a 123 bc');
  await shot('3-plate');
  await mainButton.click();
  // The seats of a Damas (6) are chosen in advance (docs/50).
  await expect(page.getByText(TEXT.seatsTitle)).toBeVisible();
  await shot('3-seats');
  await mainButton.click();
  await page.getByText(TEXT.addPhoto).click();
  await cameraReady(page);
  await shot('4-avatar-camera');
  await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
  await expect(mainButton).toBeVisible();
  await shot('4-avatar');
  await mainButton.click();
  await expect(page.getByText(TEXT.photoFront)).toBeVisible();
  await shot('5-photos-empty');
  for (const taken of [1, 2, 3]) {
    await page.getByText(TEXT.take).first().click();
    await cameraReady(page);
    if (taken === 1) await shot('5-photos-camera');
    await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
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
