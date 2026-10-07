import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;

// Our camera screen is open and the fake camera shows a picture.
async function cameraReady(page: Page) {
  const shutter = page.getByRole('dialog').getByLabel(TEXT.shutter);
  await expect(shutter).toBeEnabled();
}

const tile = (page: Page, label: string) => page.locator('.photo-tile', { hasText: label });

// «Mashinangiz» like a person (G62, mockup g62/1 screen 2): the model by its button, the color by
// its dot, the plate typed without spaces; a Damas brings its 6 seats.
export async function fillCar(page: Page, shot: Shot = async () => undefined) {
  await page.getByText(TEXT.becomeDriver).first().click();
  await expect(page.getByText(TEXT.carTitle)).toBeVisible();
  await shot('2-car-empty');
  await page.getByRole('button', { name: 'Damas', exact: true }).click();
  await page.getByRole('button', { name: 'Oq', exact: true }).click();
  await page.getByLabel(TEXT.plateField).fill('01a1');
  await shot('2-car-typing');
  await page.getByLabel(TEXT.plateField).fill('011');
  await shot('2-car-company');
  await page.getByLabel(TEXT.plateField).fill('01a123bc');
  await shot('2-car');
}

// The 3 car photos: the first by its tile, then the camera opens by itself for the next (G40, K7).
async function takeCarPhotos(page: Page, shot: Shot = async () => undefined) {
  await tile(page, TEXT.photoFront).click();
  for (const label of [TEXT.photoFront, TEXT.photoSide, TEXT.photoInside]) {
    await cameraReady(page);
    if (label === TEXT.photoFront) await shot('3-photos-camera');
    await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
    await expect(tile(page, label)).toHaveAttribute('data-taken', 'true');
  }
  await expect(page.locator('.photo-tile img')).toHaveCount(3);
}

// The driver application in 2 screens (G62, docs/118 path 5): the car, then its 3 photos and the
// sending; the main screen says it is checked, no «Ariza yuborildi».
export async function applyAsDriver(page: Page, shot: Shot = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(TEXT.becomeDriver)).toBeVisible();
  await shot('1-home');
  await fillCar(page, shot);
  await mainButton.click();
  await expect(page.getByText(TEXT.photos)).toBeVisible();
  await expect(page.getByRole('img', { name: '01 A 123 BC' })).toBeVisible();
  await shot('3-photos-empty');
  await takeCarPhotos(page, shot);
  await shot('3-photos');
  await expect(mainButton).toHaveText(TEXT.send);
  await mainButton.click();
  await expect(page.getByText(TEXT.check)).toBeVisible();
  await shot('4-pending');
}
