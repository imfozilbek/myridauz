import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT } from './apps';
import { findTrips } from './market';
import { pressBack } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;
const B = {
  myTrips: t('common.myTrips'),
  seats: t('bookings.seats.title'),
  twoSeats: t('market.request.seats', { count: '2' }),
  sent: t('bookings.sent.title'),
  plate: t('bookings.plate'),
  offers: t('bookings.offer.list'),
  accept: t('bookings.offer.accept'),
  accepted: t('bookings.offer.accepted.title'),
  confirm: t('bookings.confirm'),
  sure: t('bookings.confirm.title'),
  confirmed: t('bookings.confirmed.title'),
  notEnough: t('wallet.notEnough.title'),
  topUp: t('wallet.topUp'),
  wallet: t('wallet.title'),
  wallets: t('wallet.team.title'),
  adjust: t('wallet.adjust.title'),
  history: t('wallet.history'),
};

// A passenger books 2 seats on a found trip (G08): seats, the check, sent.
export async function bookSeats(page: Page, shot: Shot = none) {
  const mainButton = page.locator('#tg-main-button');
  await findTrips(page);
  await page.getByText(TEXT.book).click();
  await expect(page.getByText(B.seats)).toBeVisible();
  await shot('1-seats');
  await page.getByText(B.twoSeats).click();
  await expect(mainButton).toBeVisible();
  await shot('2-review');
  await mainButton.click();
  await expect(page.getByText(B.sent)).toBeVisible();
  await shot('3-sent');
}

// "Mening safarlarim" of a passenger: a confirmed seat opens the plate; a driver's offer is accepted.
export async function passengerTrips(page: Page, shot: Shot = none) {
  await page.getByText(B.myTrips).click();
  await expect(page.getByText(t('bookings.mine'))).toBeVisible();
  await shot('1-list');
  await page.getByText('Jasur').first().click();
  await expect(page.getByText(B.plate)).toBeVisible();
  await shot('2-booking');
  await pressBack(page);
  await page.getByText('Madina').click();
  await expect(page.getByText(B.offers)).toBeVisible();
  await shot('3-request');
  await page.getByText('Jasur').click();
  await expect(page.getByText(B.accept)).toBeVisible();
  await shot('4-offer');
  await page.getByText(B.accept).click();
  await expect(page.getByText(B.accepted)).toBeVisible();
  await shot('5-accepted');
}

// The driver opens the own trip, a booking of Madina, confirms after "Ishonchingiz komilmi?".
export async function confirmBooking(page: Page, shot: Shot = none, money = true) {
  const mainButton = page.locator('#tg-main-button');
  await page.getByText(B.myTrips).click();
  await page.getByText('Jasur').first().click();
  await expect(page.getByText('Madina')).toBeVisible();
  await shot('1-trip');
  await page.getByText('Madina').click();
  await shot('2-booking');
  await page.getByText(B.confirm, { exact: true }).click();
  await expect(page.getByText(B.sure)).toBeVisible();
  await shot('3-sure');
  await mainButton.click();
  await expect(page.getByText(money ? B.confirmed : B.notEnough)).toBeVisible();
  await shot(money ? '4-confirmed' : '4-not-enough');
  if (money) return;
  await mainButton.click();
  await expect(page.getByText(t('wallet.topUp.title'))).toBeVisible();
  await shot('5-top-up');
}

// "Hamyon" from the driver's profile: the bonus, its end, the history.
export async function openWallet(page: Page, shot: Shot = none) {
  await page.getByText(TEXT.profile).click();
  await shot('1-profile');
  await page.getByText(B.wallet, { exact: true }).click();
  await expect(page.getByText(B.history)).toBeVisible();
  await shot('2-wallet');
}

// The team: "Hamyonlar", one wallet, the owner's hand correction.
export async function teamWallets(page: Page, shot: Shot = none) {
  await page.getByText(TEXT.management).click();
  await page.getByText(B.wallets, { exact: true }).click();
  await expect(page.getByText('Jasur')).toBeVisible();
  await shot('1-list');
  await page.getByText('Jasur').click();
  await expect(page.getByText(B.adjust)).toBeVisible();
  await shot('2-wallet');
  await page.getByText(B.adjust).click();
  await page.getByLabel(t('wallet.adjust.amount')).fill('100000');
  await page.getByLabel(t('wallet.adjust.reason')).fill('Yoʻlovchi kelmadi');
  await shot('3-adjust');
}
