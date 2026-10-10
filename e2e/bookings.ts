import { expect, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT } from './apps';
import { mapState, mockMap } from './map-mock';
import { placeFound } from './map-wait';
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
  offers: t('bookings.request.offers', { count: '1' }),
  accept: t('bookings.offer.accept'),
  confirm: t('bookings.confirm'),
  confirmed: t('bookings.confirmed.title'),
  notEnough: t('wallet.notEnough.title'),
  topUp: t('wallet.topUp'),
  wallet: t('wallet.title'),
  wallets: t('wallet.team.title'),
  adjust: t('wallet.adjust.title'),
  history: t('wallet.history'),
};

// One end of a booking on «Qayerdan, qayerga?»: its row opens the map, the main button takes it (G59).
export async function takeEnd(page: Page, end: 'pickup' | 'dropoff', search?: [string, string]) {
  await page.getByText(t(end === 'pickup' ? 'way.book.pickup' : 'way.book.dropoff')).click();
  await expect(page.getByText(t(end === 'pickup' ? 'way.point.from' : 'way.point.to'))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  if (search) {
    await page.getByPlaceholder(t('way.point.search')).fill(search[0]);
    await page.getByText(search[1], { exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(`${search[1]} yaqinida`);
  } else await placeFound(page);
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

// "Mening safarlarim" of a passenger: a confirmed seat opens the plate; a driver's offer is accepted
// right in its card and the page of the seat opens (G61, mockup 3-offers A).
export async function passengerTrips(page: Page, shot: Shot = none) {
  await page.getByText(B.myTrips).click();
  await expect(page.locator('.mine-card').first()).toBeVisible();
  await shot('1-list');
  await page.getByText('Jasur').first().click();
  await expect(page.locator('.uz-plate').first()).toBeVisible();
  await shot('2-booking');
  await pressBack(page);
  // The own request card shows no own name (G37, docs/101 R6): «… · Soʻrov» opens it (mockup g75/2 A).
  await page.getByText(/ · Soʻrov$/u).first().click();
  await expect(page.getByText(B.offers)).toBeVisible();
  await shot('3-request');
  await page.getByRole('button', { name: B.accept }).click();
  await expect(page.getByText(B.confirmed)).toBeVisible();
  await shot('5-accepted');
}

// The driver opens the own trip and answers the request of Madina right in its card: the commission
// is there, no window in between (G63, docs/122); without money the card leads to the top up.
export async function confirmBooking(page: Page, shot: Shot = none, money = true) {
  const mainButton = page.locator('#tg-main-button');
  await page.getByText(B.myTrips).click();
  await openOwnTrip(page);
  await expect(page.getByText('Madina')).toBeVisible();
  await expect(page.getByText(/komissiya 18\s000/u)).toBeVisible();
  await shot('1-trip');
  if (money) {
    await Promise.all([
      page.waitForRequest('**/api/driver/bookings/*/confirm'),
      page.getByRole('button', { name: B.confirm, exact: true }).click(),
    ]);
    await shot('2-confirmed');
    return;
  }
  // Without money for the commission the way to top up comes instead, no «Tasdiqlash» (docs/83 N20).
  await page.getByRole('button', { name: B.topUp, exact: true }).click();
  await expect(page.getByText(B.notEnough)).toBeVisible();
  await shot('3-not-enough');
  await mainButton.click();
  await expect(page.getByRole('heading', { name: t('wallet.topUp.title') })).toBeVisible();
  await shot('4-top-up');
}

// "Hamyon" from its tile on the main screen of an approved driver (docs/118 path 9, G65): the bonus,
// its end, the history.
export async function openWallet(page: Page, shot: Shot = none) {
  const tile = page.getByRole('button', { name: new RegExp(`^${B.wallet}`, 'u') });
  await expect(tile).toBeVisible();
  await shot('1-home');
  await tile.click();
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
