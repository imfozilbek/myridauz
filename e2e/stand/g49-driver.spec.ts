import { createMarketClient } from '@platform/api-client';
import { MY_TRIP_LINK, type Trip } from '@platform/contracts';
import { expect, test } from '../crash-guard';
import { publishButton, TEXT } from '../apps';
import { confirmedSeat, MINUTE, moveTrip, SAMARQAND, wordsOf } from './g27-kit';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import { mainButton, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, signedAs, type Person } from './stand-kit';
import { botMessages, runCron } from './stand-tools';

// G49 (docs/78 D02, D04, D28, D29, D48, docs/80 S52): the driver on the whole local Rida.
test.describe.configure({ mode: 'serial' });
const person = (id: number, name: string): Person => ({ id, name, phone: `998901110${id - 900000}` });
const OYDIN = person(900911, 'Oydin');
const SHUHRAT = person(900912, 'Shuhrat');
const ZAFAR = person(900913, 'Zafar');
const BOTIR = person(900914, 'Botir');
const MAVLUDA = person(900915, 'Mavluda');
const OLIM = person(900916, 'Olim');
const RIDERS = [person(900917, 'Asal'), person(900918, 'Barno'), person(900919, 'Charos')];
// Three doors in Chilonzor: the second is a kilometre away, the third next to the first.
const DOORS = [
  { lat: 41.2847, lng: 69.2152 },
  { lat: 41.279, lng: 69.205 },
  { lat: 41.2852, lng: 69.216 },
];
const DROPOFF = { lat: 39.6542, lng: 66.9597 };

// A trip of the driver that ended: its clock moved back, the Cron completes it (docs/80 S20).
async function endedTrip(driver: Person, passenger: Person): Promise<Trip> {
  await register('passenger', passenger, 'female');
  const { trip } = await confirmedSeat(driver, passenger);
  moveTrip(trip.id, Date.now() - 10 * 60 * MINUTE, Date.now() - MINUTE);
  await runCron();
  return trip;
}
const liveTrips = async (driver: Person) =>
  (await createMarketClient(await signedAs('driver', driver)).myTrips()).filter(
    (trip) => trip.status === 'active',
  );

test('D02, D04. a computer: a car of «Boshqa» typed with its seats, then the photo only from a phone', async ({
  page,
}) => {
  await register('driver', OYDIN, 'female');
  await openAs(page, 'driver', OYDIN, { platform: 'tdesktop' });
  await page.getByText(TEXT.becomeDriver).first().click();
  await expect(page.getByText(TEXT.carTitle)).toBeVisible();
  await page.getByText(t('drivers.car.other')).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByPlaceholder(t('drivers.other.search')).fill('Isuzu Grafter');
  // The button of Telegram is a part of the page on the stand, over the sheet; on a phone it is not.
  await sheet.getByText(t('drivers.other.add', { name: 'Isuzu Grafter' })).dispatchEvent('click');
  await expect(page.getByText('Isuzu Grafter')).toBeVisible();
  await page.getByRole('button', { name: 'Oshirish' }).click();
  await expect(page.getByText('5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Oq', exact: true }).click();
  await page.getByLabel(TEXT.plateField).fill('01g911oy');
  await mainButton(page).click();
  await expect(page.getByText(TEXT.photos)).toBeVisible();
  await expect(page.getByText(t('drivers.photos.phoneOnly'))).toBeVisible();
  await expect(page.locator('.photo-tile').first()).toBeDisabled();
});

test('S52. the team approves: «Siz haydovchisiz!» and «Safar eʼlon qilish» on the main screen', async ({
  page,
}) => {
  await approvedDriver(SHUHRAT, '01G912SH');
  await openAs(page, 'driver', SHUHRAT);
  await expect(page.getByText(t('drivers.approved.title'))).toBeVisible();
  await expect(mainButton(page)).toHaveText(t('home.publish'));
});

// «Qaytishni eʼlon qilish» of the past trip: the route the other way with its seats and price, and
// «Mashinada ayol bor» off although a woman rode (docs/143, docs/06).
test('D28. the way back after the trip: the route turned, the seats and the price kept', async ({ page }) => {
  await approvedDriver(ZAFAR, '01G913ZF');
  const trip = await endedTrip(ZAFAR, MAVLUDA);
  await openAs(page, 'driver', ZAFAR, { search: `?${MY_TRIP_LINK}=${trip.id}` });
  await mainButton(page)
    .filter({ hasText: t('driverAfter.back.publish') })
    .click();
  await mainButton(page).filter({ hasText: TEXT.publish }).click();
  await expect.poll(async () => (await liveTrips(ZAFAR)).length).toBe(1);
  const [back] = await liveTrips(ZAFAR);
  expect(back).toMatchObject({ from: trip.to, to: trip.from, seats: trip.seats, price: trip.price });
  expect(back?.woman).toBe(false);
});

test('D29. the last route of the driver fills the one screen of a new trip from the main screen', async ({
  page,
}) => {
  await approvedDriver(BOTIR, '01G914BT');
  await endedTrip(BOTIR, person(900920, 'Dildora'));
  await openAs(page, 'driver', BOTIR);
  await publishButton(page).click();
  await expect(mainButton(page)).toHaveText(TEXT.publish);
  await expect(page.getByText(/Samarqand/u).first()).toBeVisible();
});

// The doors of the day in the order of the road (docs/68, mockup g68/3): the nearest next, whoever
// booked first; nobody orders them by hand.
test('D48. «Yoʻl tartibi» of the trip day goes door by nearest door', async () => {
  await approvedDriver(OLIM, '01G916OL');
  const trip = await publishTrip(OLIM, CHILONZOR, SAMARQAND, 'door', 0);
  for (const [index, rider] of RIDERS.entries()) {
    await register('passenger', rider, 'female');
    const seat = await book(rider, trip, {
      seats: 1,
      mode: 'door',
      pickup: DOORS[index] ?? null,
      dropoff: DROPOFF,
    });
    await answer(OLIM, seat.id, 'confirm');
  }
  const road = async () =>
    (await botMessages())
      .filter((m) => m.bot === 'driver' && m.chatId === OLIM.id && m.text.includes(wordsOf('bot.dcard.road')))
      .at(-1)?.text ?? '';
  await expect.poll(road).toContain(`${RIDERS[2]?.name ?? ''}, 1 joy`);
  const text = await road();
  const [first, far, near] = RIDERS.map((rider) => text.indexOf(`${rider.name}, 1 joy`));
  expect(first).toBeGreaterThan(-1);
  expect(first).toBeLessThan(near ?? -1);
  expect(near).toBeLessThan(far ?? -1);
});
