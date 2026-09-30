import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { mockFeedback } from './feedback-mock';
import { chooseWay } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, , ADMIN] = MINI_APPS;
const shooter = (page: Page, prefix: string) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/${prefix}-${name}.png`, fullPage: true });
};
const open = async (page: Page, url: string) => {
  await mockTelegram(page);
  await page.goto(url);
};

// Screens of G11 for the owner review (docs/33): the review, the complaint, the rating, the team.
test('passenger: rates the driver from the bot and complains', async ({ page }) => {
  await mockApi(page, 'active');
  await mockFeedback(page);
  const shot = shooter(page, 'review');
  await open(page, telegramUrl(`${appUrl(PASSENGER.port)}?review=b1`));
  await expect(page.getByText(t('reviews.about', { name: 'Jasur' }))).toBeVisible();
  await page.getByRole('button', { name: '5' }).click();
  await page.getByText(t('reviews.tag.on_time')).click();
  await page.getByText(t('reviews.tag.clean_car')).click();
  await page.getByPlaceholder(t('reviews.textPlaceholder')).fill('Juda yaxshi haydovchi');
  await shot('1-form');
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(t('reviews.sent'))).toBeVisible();
  await shot('2-sent');
  // The same Telegram client: only the address changes.
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?complain=b1`));
  await page.getByText(t('complaints.reason.harassment')).click();
  await page.getByPlaceholder(t('complaints.commentPlaceholder')).fill('Yoʻlda qoʻpol gapirdi');
  await shooter(page, 'complaint')('1-form');
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(t('complaints.sent'))).toBeVisible();
  await shooter(page, 'complaint')('2-sent');
});

test('passenger: the rating on the trip and the reviews', async ({ page }) => {
  await mockApi(page, 'active');
  await mockFeedback(page);
  const shot = shooter(page, 'rating');
  await open(page, telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(TEXT.findTrip).click();
  await chooseWay(page);
  await page.getByText(TEXT.tomorrow).click();
  await expect(page.getByText('Jasur').first()).toBeVisible();
  await shot('1-results');
  await page.getByText('Jasur').first().click();
  await expect(page.getByText('Vaqtida yetib keldik, rahmat!')).toBeVisible();
  await shot('2-trip');
});

test('admin: the complaints queue, the chat and the decision', async ({ page }) => {
  await mockApi(page, 'active');
  await mockFeedback(page);
  const shot = shooter(page, 'complaints');
  await open(page, telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.complaints'), { exact: true }).click();
  await expect(page.getByText(t('complaints.high'))).toBeVisible();
  await shot('1-queue');
  await page.getByText(t('complaints.reason.harassment')).click();
  await expect(page.getByText(t('complaints.decision'))).toBeVisible();
  await shot('2-complaint');
  await page.getByText(t('complaints.chat'), { exact: true }).click();
  await expect(page.getByText('Ha, tezroq boʻling, kutib oʻtirmayman.')).toBeVisible();
  await shot('3-chat');
  await page.getByText(t('complaints.block7')).click();
  await expect(page.getByText(t('complaints.decided'))).toBeVisible();
  await shot('4-decided');
});
