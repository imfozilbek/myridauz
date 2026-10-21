import { createMarketClient } from '@platform/api-client';
import { FIND_LINK, HOUR_MS, requestsLinkValue, tashkentDate, type Trip } from '@platform/contracts';
import { channelOf, loadBrand } from '../../brands/index';
import { expect, test, type Page } from '../crash-guard';
import { publishButton } from '../apps';
import { openFromList } from '../market';
import { showChat } from './bot-chat';
import { channelChat } from './first-contact-kit';
import { MINUTE, outcome, toldBy } from './g27-kit';
import { shootIn } from './g63-kit';
import { answer, book, CHILONZOR } from './market-kit';
import { freshDriver } from './schedule-kit';
import { mainButton, NARROW, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { botMessages, clearBotMessages, runCron, standRows, standSql } from './stand-tools';

// «Oraliqda» (G90, docs/216) on the whole local Rida: the driver publishes 08:00 … 10:00 tomorrow on
// the form, the passenger finds and books it, the bots and the channel say the range, the time moves
// by a whole hour, and the Cron waits for the end of the range. Every place is shot for the owner.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

// A route of this goal only (lesson 95): Chilonzor → Termiz shahri, its own channel.
const TERMIZ = '1722401';
const TO_TERMIZ = { pickup: { lat: 41.2847, lng: 69.2152 }, dropoff: { lat: 37.2242, lng: 67.2783 } };
const DRIVER: Person = { id: 900951, name: 'Farhod', phone: '998901110951' };
const PASSENGER: Person = { id: 900952, name: 'Dildora', phone: '998901110952' };
const CHANNEL = channelOf(loadBrand(), TERMIZ);
const DAY_ROW = new RegExp(`^(${t('market.day.today')}|${t('market.day.tomorrow')}), `, 'u');
const WALK = { platform: 'android' } as const;
const shoot = shootIn('g90');
const inApp = (from: string, to: string) => t('market.trip.range', { from, to });
const inBot = (from: string, to: string) => t('bot.time.range', { from, to });

// The chats as Telegram shows them, drawn for the owner (G68).
async function draw(page: Page, name: string, messages: Awaited<ReturnType<typeof botMessages>>, bot: Chat) {
  await showChat(page, bot, messages);
  await page.screenshot({ path: `screenshots/stand/g90/${name}.png`, fullPage: true });
  // The chat sets its own size: the screens after it are the phone again.
  await page.setViewportSize(NARROW);
}
type Chat = Parameters<typeof showChat>[1];
const ofBot = async (bot: 'passenger' | 'driver', person: Person) =>
  (await botMessages()).filter((message) => message.bot === bot && message.chatId === person.id);
const ofChannel = async () => (await botMessages()).filter((message) => message.chat === CHANNEL?.chat);

test.beforeAll(async () => {
  await approvedDriver(DRIVER, '01G090RA');
  await register('passenger', PASSENGER, 'female');
});

let trip: Trip;

test('T3 … T6. the driver publishes 08:00 … 10:00 on the form; the passenger finds it', async ({ page }) => {
  freshDriver(DRIVER);
  await clearBotMessages();
  await openAs(page, 'driver', DRIVER);
  await publishButton(page).click();
  await openFromList(page);
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
  await page.getByAltText('Surxondaryo viloyati').click();
  await page.getByText('Termiz shahri', { exact: true }).click();
  await expect(mainButton(page)).toHaveText(t('market.publish.send'));
  await page.getByText(t('way.trip.mode.door'), { exact: true }).click();
  await page.getByText(DAY_ROW).first().click();
  await page.locator('.week-day').nth(1).click();
  await page.getByText(t('market.when.range'), { exact: true }).click();
  await page.getByRole('button', { name: '08:00', exact: true }).click();
  await page.getByRole('button', { name: '10:00', exact: true }).click();
  const date = t('market.day.tomorrow');
  await expect(
    page.getByText(t('market.publish.dayRange', { date, from: '08:00', to: '10:00' })),
  ).toBeVisible();
  await shoot(page, WALK, '1-form');
  await mainButton(page).click();
  await expect(page.getByText(t('driverTrip.published.title'))).toBeVisible();
  await expect(page.getByText(inApp('08:00', '10:00')).first()).toBeVisible();
  await shoot(page, WALK, '2-my-trip');
  const market = createMarketClient(await signedAs('driver', DRIVER));
  const [mine] = (await market.myTrips()).filter((item) => item.status === 'active');
  if (!mine) throw new Error('g90: the range trip is missing');
  trip = mine;
  expect(trip.departUntil).toBe(trip.departAt + 2 * HOUR_MS);
  // The channel of Termiz posts the range, no arrival (docs/217).
  const posted = async () => (await ofChannel()).some((post) => post.text.includes(inApp('08:00', '10:00')));
  await expect.poll(posted).toBe(true);
  if (CHANNEL) await draw(page, '3-channel', await ofChannel(), channelChat(CHANNEL));
  // The passenger: the list and the page of the trip say the range, no arrival.
  const link = requestsLinkValue(CHILONZOR, TERMIZ, tashkentDate(trip.departAt));
  await openAs(page, 'passenger', PASSENGER, { search: `?${FIND_LINK}=${link}` });
  const card = page.locator('.search-trip').filter({ hasText: DRIVER.name }).first();
  await expect(card.getByText(inApp('08:00', '10:00'))).toBeVisible();
  await shoot(page, WALK, '4-search');
  await card.click();
  await expect(page.getByText(inApp('08:00', '10:00')).first()).toBeVisible();
  await shoot(page, WALK, '5-trip');
});

test('T6, T7. the bots say the range; the time moves by a whole hour only', async ({ page }) => {
  const seat = await book(PASSENGER, trip, { seats: 1, mode: 'door', ...TO_TERMIZ });
  await answer(DRIVER, seat.id, 'confirm');
  await toldBy('passenger', PASSENGER, inBot('08:00', '10:00'));
  const market = createMarketClient(await signedAs('driver', DRIVER));
  expect(await outcome(market.retimeTrip(trip.id, trip.departAt + 30 * MINUTE))).toBe('trips.invalid_input');
  const moved = await market.retimeTrip(trip.id, trip.departAt + HOUR_MS);
  expect(moved.departUntil).toBe(trip.departAt + 3 * HOUR_MS);
  await toldBy('passenger', PASSENGER, inBot('09:00', '11:00'));
  await draw(page, '6-passenger-bot', await ofBot('passenger', PASSENGER), 'passenger');
  await draw(page, '7-driver-bot', await ofBot('driver', DRIVER), 'driver');
});

test('T7. after its start the search keeps the range; the Cron waits for its end', async () => {
  const at = (minutes: number) => Date.now() + minutes * MINUTE;
  const place = (start: number, end: number) =>
    standSql(`UPDATE trips SET depart_at = ${start}, depart_until = ${end} WHERE id = '${trip.id}'`);
  // Started an hour ago, ends in an hour: the passenger still finds it.
  place(at(-60), at(60));
  const passenger = createMarketClient(await signedAs('passenger', PASSENGER));
  const started = { from: CHILONZOR, to: TERMIZ, date: tashkentDate(at(-60)) };
  expect((await passenger.searchTrips(started)).map((found) => found.id)).toContain(trip.id);
  // Three hours after the start, half an hour after the end: an exact time would be on the road.
  place(at(-180), at(-30));
  await runCron();
  const departed = () => standRows(`SELECT departed_at FROM trips WHERE id = '${trip.id}'`)[0]?.departed_at;
  expect(departed()).toBe(null);
  // Two hours after the end: the Cron puts it on the road.
  place(at(-240), at(-125));
  await runCron();
  await expect.poll(departed).not.toBe(null);
});
