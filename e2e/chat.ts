import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { pressBack } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;

// A passenger opens the booking: the chat, a hidden phone, "Mashinaga chiqdim" (G09).
export async function passengerChat(page: Page, shot: Shot = none) {
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await expect(page.getByText(t('share.send'))).toBeVisible();
  await shot('1-booking');
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText(t('chat.system.confirmed'))).toBeVisible();
  await shot('2-chat');
  await page.getByLabel(t('chat.placeholder')).fill('Raqamim 90 123 45 67');
  await page.getByText(t('chat.send'), { exact: true }).click();
  await expect(page.getByText(t('chat.warning'))).toBeVisible();
  await expect(page.getByText('Raqamim ***')).toBeVisible();
  await shot('3-masked');
  await pressBack(page);
  await page.getByText(t('share.boarded')).click();
  await expect(page.getByText(t('share.told'))).toBeVisible();
  await shot('4-boarded');
}

// A close person opens the card link: the trip without registration, "Xabar olish" (docs/43).
export async function followTrip(page: Page, shot: Shot = none) {
  await expect(page.getByText(t('share.follow.title', { name: 'Madina' }))).toBeVisible();
  await shot('1-trip');
  await page.getByText(t('share.follow.subscribe')).click();
  await expect(page.getByText(t('share.follow.subscribed'))).toBeVisible();
  await shot('2-subscribed');
}
