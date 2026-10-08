import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT, newTripTile } from './apps';
import { chooseRoute } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, DRIVER] = MINI_APPS;

// The driver's step «Qanday band qilinadi?» as the mockup 2-whole-car screen 1 shows it: a Cobalt
// of 4 seats at 90 000 a seat, «Joylar yoki butun salon» chosen.
export async function openRuleStep(page: Page) {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  const main = page.locator('#tg-main-button');
  await newTripTile(page).click();
  await chooseRoute(page);
  await page.getByText(t('way.trip.mode.both')).click();
  await page.getByText(TEXT.tomorrow).click();
  await main.click();
  await expect(page.getByText(TEXT.tripSeatsTitle)).toBeVisible();
  await main.click();
  await expect(page.getByText(TEXT.priceTitle)).toBeVisible();
  await main.click();
  await page.getByText(t('market.rule.seatsOrCar')).click();
  await expect(page.locator('.rule-card-on')).toContainText(t('market.rule.seatsOrCar'));
  await page.mouse.move(0, 0);
}
