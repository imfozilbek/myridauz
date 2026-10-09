import { expect, test } from '../crash-guard';
import { TEXT, newTripTile } from '../apps';
import { openOwnTrip } from '../market';
import { book } from './market-kit';
import { askRide, confirmedSeat, setBonus, TO_SAMARQAND } from './g27-kit';
import { MUROD, ZEBO } from './people';
import { mainButton, NARROW, openHome, PLATFORMS, shot, t, visit } from './screen-tour';
import { register } from './seed';
import type { Person } from './stand-kit';

// Every screen of a driver with real data (docs/83): Murod has a confirmed seat, a waiting one, a
// request of a passenger on his route; then his wallet is empty and a seat cannot be confirmed.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
const links: Record<string, string> = {};
const WELCOME_BONUS = 500_000;
const WAITING: Person = { id: 900704, name: 'Robiya', phone: '998901110704' };

test.beforeAll(async () => {
  const { trip, seat } = await confirmedSeat(MUROD, ZEBO);
  links['booking'] = seat.id;
  links['trip'] = trip.id;
  await register('passenger', WAITING, 'female');
  const waiting = await book(WAITING, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  links['waiting'] = waiting.id;
  await askRide(WAITING);
});

for (const platform of PLATFORMS)
  test(`${platform}: home, profile, wallet and my trips`, async ({ page }) => {
    await openHome(page, 'driver', MUROD, platform);
    await shot(page, platform, 'da10-home');
    await page.getByLabel(t('account.profile.open')).click();
    await shot(page, platform, 'da11-profile');
    await visit(page, platform, t('wallet.title'), 'da12-wallet');
    await visit(page, platform, t('comfort.history.title'), 'da13-history');
  });

test('android: a trip, its seats, its map and a waiting seat', async ({ page }) => {
  await openHome(page, 'driver', MUROD, 'android', `?booking=${links['booking']}`);
  await shot(page, 'android', 'da20-booking');
  await openHome(page, 'driver', MUROD, 'android');
  await page.getByText(t('common.myTrips')).first().click();
  await shot(page, 'android', 'da21-my-trips');
  await openOwnTrip(page);
  await shot(page, 'android', 'da22-trip');
  await visit(page, 'android', t('driverTrip.tile.map'), 'da23-trip-map');
});

// «Yoʻlovchilar soʻrovlari» (G64, docs/118 path 7): Murod has a trip tomorrow, so its banner stands
// on top and the requests of its day under it; the chat of a request carries the same offer.
test('android: the requests of passengers and an offer', async ({ page }) => {
  await openHome(page, 'driver', MUROD, 'android');
  await page.getByText(t('common.driver.passengerRequests')).first().click();
  const row = page.locator('.request-row', { hasText: WAITING.name });
  await expect(row).toBeVisible();
  await shot(page, 'android', 'da30-requests');
  await row.getByRole('button', { name: t('chat.open') }).click();
  await expect(page.locator('.talk-action')).toBeVisible();
  await shot(page, 'android', 'da31-request-talk');
});

// One screen (G63, docs/118 path 6): the way of pickup, the seats of the car with «Mashinada ayol
// bor» when fewer, the rule and the comment on their own screens and back.
test('android: publish a trip on one screen up to «Eʼlon qilish»', async ({ page }) => {
  await openHome(page, 'driver', MUROD, 'android');
  await newTripTile(page).click();
  await page.getByText(TEXT.from).click();
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
  await page.getByAltText('Samarqand viloyati').click();
  await page.getByText('Samarqand shahri', { exact: true }).click();
  await expect(mainButton(page)).toHaveText(TEXT.publish);
  await shot(page, 'android', 'da40-publish');
  await page.getByText(t('way.trip.mode.door')).click();
  // Three seats of four: somebody already goes, «Mashinada ayol bor» is right under them (G38).
  await page.getByLabel(t('market.price.less')).first().click();
  await expect(page.getByText(t('market.search.woman'))).toBeVisible();
  await shot(page, 'android', 'da43-seats-woman');
  // «Qanday band qilinadi?» (G61): seats or the whole car.
  await page.getByText(t('market.rule.title')).click();
  await shot(page, 'android', 'da44a-rule');
  await page.getByText(t('market.rule.seatsOrCar')).click();
  await mainButton(page).click();
  await page.getByText(t('market.publish.comment')).click();
  await shot(page, 'android', 'da45-comment');
  await page.getByText(TEXT.commentSkip).click();
  await expect(mainButton(page)).toHaveText(TEXT.publish);
  await shot(page, 'android', 'da46-publish');
});

test('android: an empty wallet leads to top up, not to a «Tasdiqlash» that fails', async ({ page }) => {
  await setBonus(MUROD, 0);
  await openHome(page, 'driver', MUROD, 'android', `?booking=${links['waiting']}`);
  // The commission is on the booking; its main button leads to the top up at once (G27, G63).
  await expect(mainButton(page)).toHaveText(t('wallet.topUp'));
  await mainButton(page).click();
  await expect(page.getByText(t('wallet.notEnough.title'))).toBeInViewport();
  await expect(mainButton(page)).toHaveText(t('wallet.topUp'));
  await shot(page, 'android', 'da51-not-enough');
  await mainButton(page).click();
  await expect(mainButton(page)).toHaveText(t('account.support'));
  await shot(page, 'android', 'da52-top-up');
  // The walks of passengers use Murod after this one: his bonus comes back.
  await setBonus(MUROD, WELCOME_BONUS);
});
