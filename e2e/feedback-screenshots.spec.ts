import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { adminCase, appUrl, MINI_APPS, openFindTrip } from './apps';
import { mockFeedback } from './feedback-mock';
import { searchRoute } from './market';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
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
  await expect(page.getByText(t('reviews.howWas'))).toBeVisible();
  await page.getByRole('button', { name: '5' }).click();
  await page.getByText(t('reviews.tag.on_time')).click();
  await page.getByText(t('reviews.tag.clean_car')).click();
  await page.getByText(t('reviews.addText')).click();
  await page.getByPlaceholder(t('reviews.textPlaceholder')).fill('Juda yaxshi haydovchi');
  await shot('1-form');
  // Sent: no screen after it, the app closes back to the bot (G60).
  await page.locator('#tg-main-button').click();
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
  await openFindTrip(page);
  await searchRoute(page);
  await expect(page.getByText('Jasur').first()).toBeVisible();
  await shot('1-results');
  await page.getByText('Jasur').first().click();
  await expect(page.getByText('Vaqtida yetib keldik, rahmat!')).toBeVisible();
  await shot('2-trip');
});

test('admin: a complaint in «Navbat», the chat and the decision (G75)', async ({ page }) => {
  await mockApi(page, 'active');
  await mockFeedback(page);
  const shot = shooter(page, 'complaints');
  // A button of the admin bot opens the urgent complaint as a case of «Navbat» (docs/17, G75).
  await open(page, telegramUrl(adminCase('complaint=c1')));
  await expect(page.getByText(t('complaints.reason.harassment'))).toBeVisible();
  await shot('2-complaint');
  await page.getByText(t('navbat.complaint.chat'), { exact: true }).click();
  await expect(page.getByText('Ha, tezroq boʻling, kutib oʻtirmayman.')).toBeVisible();
  await shot('3-chat');
  await pressBack(page);
  await page.getByText(t('moderation.block'), { exact: true }).click();
  await page.getByText(t('moderation.block.days', { days: '7' })).click();
  await expect(page.getByText(t('moderation.blocked'))).toBeVisible();
  await shot('4-decided');
});
