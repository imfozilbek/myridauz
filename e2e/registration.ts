import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;

// Goes through the first entry like a person, in two screens (G34): the welcome with the consent,
// then «Siz haqingizda» (the name from Telegram, the gender) and the phone.
export async function register(page: Page, welcome: string, shot: Shot = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(welcome)).toBeVisible();
  await expect(page.getByText(TEXT.offerLink)).toBeVisible();
  await shot('1-welcome');
  await mainButton.click();
  await expect(page.getByText(TEXT.about)).toBeVisible();
  await expect(page.getByPlaceholder('Ism')).toHaveValue('Dilnoza');
  await page.getByText(TEXT.female, { exact: true }).click();
  await expect(mainButton).toHaveText(TEXT.sendPhone);
  await shot('2-about');
  await mainButton.click();
}
