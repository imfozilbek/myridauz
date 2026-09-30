import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const shooter = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/legal-${name}.png`, fullPage: true });
};

// The screens of G14 for the owner review (docs/33): documents, their links and "delete my data".
test('consent: each document opens before "Roziman"', async ({ page }) => {
  await mockApi(page, 'unregistered');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  const shot = shooter(page);
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(t('legal.offer.title'))).toBeVisible();
  await shot('1-consent');
  await page.getByText(t('legal.offer.title')).click();
  await expect(page.getByText(`1. ${t('legal.offer.1.title')}`)).toBeVisible();
  await shot('2-offer');
});

test('a bot link opens the privacy policy', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(DRIVER.port)}?doc=privacy`));
  await expect(page.getByText(t('legal.privacy.6.title'), { exact: false })).toBeVisible();
  await shooter(page)('3-privacy');
});

test('a bot link opens the consent', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?doc=consent`));
  await expect(page.getByText(`1. ${t('legal.consent.1.title')}`)).toBeVisible();
  await shooter(page)('4-consent-document');
});

test('profile: documents and "Maʼlumotlarimni oʻchirish"', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  const shot = shooter(page);
  await page.getByText(TEXT.profile).click();
  await expect(page.getByText(t('account.delete.open'))).toBeVisible();
  await shot('5-profile');
  await page.getByText(t('account.delete.open')).click();
  await expect(page.getByText(t('account.delete.title'))).toBeVisible();
  await shot('6-delete-confirm');
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(t('account.delete.done'))).toBeVisible();
  await shot('7-deleted');
});
