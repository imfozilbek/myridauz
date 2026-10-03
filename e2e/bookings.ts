import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT } from './apps';
import { mapState, mockMap } from './map-mock';
import { findTrips, openOwnTrip } from './market';
import { pressBack } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
type Shot = (name: string) => Promise<unknown>;
const none: Shot = async () => undefined;
const B = {
  myTrips: t('common.myTrips'),
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

// A passenger books 2 seats on a found trip (G26, G35, docs/97): «Uyimdan», the point at the door
// on the map of Toshkent, the home found in Samarqand, the check with the seats, sent.
export async function bookSeats(page: Page, shot: Shot = none) {
  const mainButton = page.locator('#tg-main-button');
  await mockMap(page, mapState());
  await findTrips(page);
  await mainButton.filter({ hasText: TEXT.book }).click();
  // The trip takes people both ways: the passenger chooses «Uyimdan» (docs/70).
  await expect(page.getByText(t('way.mode.door'))).toBeVisible();
  await shot('1-mode');
  await page.getByText(t('way.mode.door')).click();
  await expect(page.getByText(t('way.point.from'))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  await expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'));
  await shot('1a-pickup');
  await mainButton.click();
  await expect(page.getByText(t('way.point.to'))).toBeVisible();
  await page.getByPlaceholder(t('bookings.map.search')).fill('Регистон');
  await page.getByText('Registon maydoni', { exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Registon maydoni yaqinida');
  await shot('1b-dropoff');
  await mainButton.click();
  await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
  await page.getByLabel(t('market.price.more')).click();
  await expect(page.getByText(B.twoSeats)).toBeVisible();
  await shot('2-review');
  await mainButton.click();
  await expect(page.getByText(B.sent)).toBeVisible();
  await expect(page.getByText(t('bookings.sent.asked'))).toBeVisible();
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
  // The own request card shows no own name (G37, docs/101 R6): the price of one seat opens it.
  await page.getByText(t('market.request.perSeat')).first().click();
  await expect(page.getByText(B.offers)).toBeVisible();
  await shot('3-request');
  await page.getByText('Jasur').click();
  await expect(page.getByText(B.accept)).toBeVisible();
  await shot('4-offer');
  await page.getByText(B.accept).click();
  await expect(page.getByText(B.accepted)).toBeVisible();
  await shot('5-accepted');
}

// The driver opens the own trip, a booking of Madina, confirms after "Joyni tasdiqlaysizmi?";
// without money, goes to top up.
export async function confirmBooking(page: Page, shot: Shot = none, money = true) {
  const mainButton = page.locator('#tg-main-button');
  await page.getByText(B.myTrips).click();
  await openOwnTrip(page);
  await expect(page.getByText('Madina')).toBeVisible();
  await shot('1-trip');
  await page.getByText('Madina').click();
  await shot('2-booking');
  await page.getByText(B.confirm, { exact: true }).click();
  // Without money for the commission the way to top up comes at once, no «Tasdiqlash» (docs/83 N20).
  if (money) {
    await expect(page.getByText(B.sure)).toBeVisible();
    await shot('3-sure');
    await mainButton.click();
    await expect(page.getByText(B.confirmed)).toBeVisible();
    await shot('4-confirmed');
    return;
  }
  await expect(page.getByText(B.notEnough)).toBeVisible();
  await shot('4-not-enough');
  await mainButton.click();
  await expect(page.getByRole('heading', { name: t('wallet.topUp.title') })).toBeVisible();
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
  await page.getByText(t('wallet.adjust.add')).click();
  await page.getByLabel(t('wallet.adjust.amount')).fill('100000');
  await page.getByLabel(t('wallet.adjust.reason')).fill('Yoʻlovchi kelmadi');
  await shot('3-adjust');
}
