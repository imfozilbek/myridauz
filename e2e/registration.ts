import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;

// Goes through the first entry like a person, in two screens (G34): the welcome with the consent,
// then «Siz haqingizda» (the name from Telegram, the gender) and the phone.
export async function register(page: Page, welcome: string, shot: Shot = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(welcome)).toBeVisible();
  await expect(page.getByText(TEXT.offerLink)).toBeVisible();
  // «Davom etish» waits for both ticks (G58, docs/118).
  await expect(mainButton).toBeDisabled();
  await shot('1-welcome');
  await tickConsents(page);
  await expect(mainButton).toBeEnabled();
  await shot('1-welcome-ticked');
  await mainButton.click();
  await expect(page.getByText(TEXT.about)).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveValue('Dilnoza');
  await page.getByText(TEXT.female, { exact: true }).click();
  // «Raqamni yuborish» waits for the face (G58): camera or gallery, here a file.
  await expect(mainButton).toBeHidden();
  await shot('2-about');
  await addFace(page);
  await expect(page.getByText(TEXT.changePhoto)).toBeVisible();
  await expect(mainButton).toHaveText(TEXT.sendPhone);
  await shot('2-about-photo');
  await mainButton.click();
}

async function tickConsents(page: Page) {
  for (const box of await page.getByRole('checkbox').all()) await box.check();
}

export async function addFace(page: Page) {
  await page.locator('.face-circle input[type="file"]').setInputFiles('e2e/fixtures/face.jpg');
}
