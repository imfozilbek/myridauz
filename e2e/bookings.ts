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
  twoSeats: t('find.book', { count: '2' }),
  points: t('bookings.points.title'),
  waiting: t('bookings.status.requested'),
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

// One end of a booking on «Qayerdan, qayerga?»: its row opens the map, the main button takes it (G59).
async function takeEnd(page: Page, end: 'pickup' | 'dropoff', search?: [string, string]) {
  await page.getByText(t(end === 'pickup' ? 'way.book.pickup' : 'way.book.dropoff')).click();
  await expect(page.getByText(t(end === 'pickup' ? 'way.point.from' : 'way.point.to'))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  if (search) {
    await page.getByPlaceholder(t('way.point.search')).fill(search[0]);
    await page.getByText(search[1], { exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(`${search[1]} yaqinida`);
  } else await expect(page.getByRole('status')).not.toHaveText(t('way.point.finding'));
  await page
    .locator('#tg-main-button')
    .filter({ hasText: t(end === 'pickup' ? 'way.point.takeFrom' : 'way.point.takeTo') })
    .click();
  await expect(page.getByText(B.points)).toBeVisible();
}

// A passenger books 2 seats on a found trip (G59, docs/118 path 2): «+» on «Safar», then the door on
// the map of Toshkent and the home found in Samarqand, sent: the booking waits for the answer at once.
export async function bookSeats(page: Page, shot: Shot = none) {
  const mainButton = page.locator('#tg-main-button');
  await mockMap(page, mapState());
  await findTrips(page);
  await page.getByLabel(t('market.price.more')).click();
  await mainButton.filter({ hasText: B.twoSeats }).click();
  await expect(page.getByText(B.points)).toBeVisible();
  await shot('1-points');
  await takeEnd(page, 'pickup');
  await shot('1a-pickup');
  await takeEnd(page, 'dropoff', ['Регистон', 'Registon maydoni']);
  await shot('2-review');
  await mainButton.filter({ hasText: t('bookings.send') }).click();
  await expect(page.getByText(B.waiting).first()).toBeVisible();
  await shot('3-sent');
}

// "Mening safarlarim" of a passenger: a confirmed seat opens the plate; a driver's offer is accepted.
export async function passengerTrips(page: Page, shot: Shot = none) {
  await page.getByText(B.myTrips).click();
  await expect(page.getByText(t('bookings.mine'))).toBeVisible();
  await shot('1-list');
  await page.getByText('Jasur').first().click();
  await expect(page.locator('.plate-badge')).toBeVisible();
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
  await page.getByLabel(TEXT.profile).click();
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
