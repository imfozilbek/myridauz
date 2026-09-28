import { expect, type Page } from '@playwright/test';
import { TEXT } from './apps';

type Shot = (name: string) => Promise<unknown>;

// Goes through the first entry like a person: welcome, consent, name, gender, phone (G04).
export async function register(page: Page, welcome: string, shot: Shot = async () => undefined) {
  const mainButton = page.locator('#tg-main-button');
  await expect(page.getByText(welcome)).toBeVisible();
  await shot('1-welcome');
  await mainButton.click();
  await expect(mainButton).toHaveText(TEXT.accept);
  await shot('2-consent');
  await mainButton.click();
  await expect(page.getByPlaceholder('Ism')).toHaveValue('Dilnoza');
  await expect(mainButton).toHaveText(TEXT.continue);
  await shot('3-name');
  await mainButton.click();
  await expect(page.getByText(TEXT.female, { exact: true })).toBeVisible();
  await shot('4-gender');
  await page.getByText(TEXT.female, { exact: true }).click();
  await expect(mainButton).toHaveText(TEXT.sendPhone);
  await shot('5-phone');
  await mainButton.click();
}
