import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;

// Our camera screen is open and the fake camera shows a picture.
async function cameraReady(page: Page) {
  const shutter = page.getByRole('dialog').getByLabel(TEXT.shutter);
  await expect(shutter).toBeEnabled();
}

// Goes through the driver application like a person: from the card of the main screen, one answer
// per screen, the face and the car on one photo screen, then «Ariza yuborildi» (G06, G34).
export async function applyAsDriver(page: Page, shot: Shot = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(TEXT.becomeDriver)).toBeVisible();
  await shot('1-home');
  await page.getByText(TEXT.becomeDriver).click();
  await expect(page.getByText('Chevrolet', { exact: true })).toBeVisible();
  await shot('2-make');
  await page.getByText('Chevrolet', { exact: true }).click();
  await expect(page.getByText('Damas', { exact: true })).toBeVisible();
  await shot('2-model');
  await page.getByText('Damas', { exact: true }).click();
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
  // A Damas has its 6 seats from the list: no seats question (docs/50).
  await mainButton.click();
  await expect(page.getByText(TEXT.photoFront)).toBeVisible();
  await shot('4-photos-empty');
  // The face first, with the front camera.
  await page.getByText(TEXT.face, { exact: true }).click();
  await cameraReady(page);
  await shot('4-face-camera');
  await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
  await expect(page.getByText(TEXT.retake)).toHaveCount(1);
  // The first car photo by its slot; the camera then opens by itself for the next one (G40, K7).
  for (const taken of [2, 3, 4]) {
    if (taken === 2) await page.getByText(TEXT.take).first().click();
    await cameraReady(page);
    if (taken === 2) await shot('4-photos-camera');
    await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
    await expect(page.getByText(TEXT.retake)).toHaveCount(taken);
  }
  await expect(mainButton).toBeVisible();
  // The car photos are shown from the application; the face as the profile has it.
  await expect(page.locator(`.photo-frame img:not([alt="${TEXT.face}"])`)).toHaveCount(3);
  await shot('4-photos');
  await mainButton.click();
  await expect(page.getByText('01 A 123 BC')).toBeVisible();
  await shot('5-review');
  await mainButton.click();
  await expect(page.getByText(TEXT.sent)).toBeVisible();
  await shot('6-sent');
  await mainButton.click();
  await expect(page.getByText(TEXT.check)).toBeVisible();
  await shot('7-pending');
}
