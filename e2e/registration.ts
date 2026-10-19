import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;

// Goes through the first entry like a person, in two screens (G34): the welcome with the consent,
// then «Siz haqingizda» (the name from Telegram, the gender) and the phone. A passenger goes without
// a photo (owner decision 19.10.2026, G51); a driver shows the face.
export async function register(
  page: Page,
  welcome: string,
  shot: Shot = async () => undefined,
  photoOptional = false,
) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(welcome)).toBeVisible();
  await expect(page.getByText(TEXT.offerLink)).toBeVisible();
  // «Davom etish» waits for both ticks (G58, docs/118).
  await expect(mainButton).toBeDisabled();
  await shot('1-welcome');
  await passConsent(page, () => shot('1-welcome-ticked'));
  await expect(page.getByRole('textbox')).toHaveValue('Dilnoza');
  await page.getByRole('radio', { name: TEXT.female }).click();
  if (photoOptional) {
    await expect(page.getByText(TEXT.optionalPhoto)).toBeVisible();
    await expect(mainButton).toHaveText(TEXT.sendPhone);
    await shot('2-about');
    return mainButton.click();
  }
  // «Raqamni yuborish» of a driver waits for the face (G58): only the front camera (owner,
  // 17.10.2026); here a file into the input of the camera app.
  await expect(mainButton).toBeDisabled();
  await shot('2-about');
  await addFace(page);
  await expect(page.getByText(TEXT.changePhoto)).toBeVisible();
  await expect(mainButton).toHaveText(TEXT.sendPhone);
  await shot('2-about-photo');
  await mainButton.click();
}

// Both ticks of screen 1, then «Davom etish» (G58): «Siz haqingizda» opens.
export async function passConsent(page: Page, ticked: () => Promise<unknown> = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  // A person taps the box itself, not the document names in the words.
  for (const box of await page.locator('.welcome-box').all()) await box.click();
  for (const box of await page.getByRole('checkbox').all()) await expect(box).toBeChecked();
  await expect(mainButton).toBeEnabled();
  await ticked();
  await mainButton.click();
  await expect(page.getByText(TEXT.about)).toBeVisible();
}

export async function addFace(page: Page) {
  await page.locator('.face-circle input[type="file"]').setInputFiles('e2e/fixtures/face.jpg');
}
