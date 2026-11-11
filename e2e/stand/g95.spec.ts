import { createDriversClient, createMarketClient, createModerationClient } from '@platform/api-client';
import { formatPlate } from '@platform/contracts';
import { expect, test } from '../crash-guard';
import { showChat } from './bot-chat';
import { MINUTE, outcome } from './g27-kit';
import { shootIn } from './g63-kit';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import { mainButton, NARROW, t } from './screen-tour';
import { apply, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { OWNER } from './people';
import { botMessages, clearBotMessages, standSql } from './stand-tools';

// G95 (docs/224) on the whole local Rida: the moderator Aziz approved Farhod, though the front photo
// shows another plate; he finds the decision in «Mening qarorlarim» and fixes the car by the photo. The
// live trip and the seat of a passenger take the fixed plate; only the driver hears it. A bad photo
// goes back for a fix while the trip goes on; a refusal goes back to «Navbat» by the owner only.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

// People and a route of this goal only (lessons 95, 378): Chilonzor → Urganch shahri.
const URGANCH = '1733401';
const TO_URGANCH = { pickup: { lat: 41.2847, lng: 69.2152 }, dropoff: { lat: 41.5506, lng: 60.6314 } };
const AZIZ: Person = { id: 900981, name: 'Aziz', phone: '998901110981' };
const FARHOD: Person = { id: 900982, name: 'Farhod', phone: '998901110982' };
const DILDORA: Person = { id: 900983, name: 'Dildora', phone: '998901110983' };
const BOBUR: Person = { id: 900984, name: 'Bobur', phone: '998901110984' };
const WRITTEN = '01G095FA';
const ON_PHOTO = '01G095FX';
const WALK = { platform: 'android' } as const;
const shoot = shootIn('g95');
const team = async (person: Person) => createModerationClient(await signedAs('admin', person));
const idOf = async (person: Person) =>
  (await (await team(OWNER)).queue()).find((one) => one.firstName === person.name)?.userId ?? '';
const paint = t('drivers.color.white').toLocaleLowerCase();
const fixedWords = t('bot.driver.carFixed', { car: `Chevrolet Cobalt, ${paint}, ${formatPlate(ON_PHOTO)}` });
const told = async (person: Person) =>
  (await botMessages()).filter((message) => message.chatId === person.id).map((message) => message.text);

// The application of Farhod, approved in T1 and sent back in T4.
let farhod = '';

test.beforeAll(async () => {
  await register('passenger', AZIZ, 'male');
  standSql(
    `INSERT OR IGNORE INTO team_members (user_id, role, added_by, added_at) VALUES (${AZIZ.id}, 'moderator', ${OWNER.id}, ${Date.now()})`,
  );
  await register('passenger', DILDORA, 'female');
});

test('T1 … T3. Aziz finds his decision and fixes the plate; the trip and the seat take it', async ({
  page,
}) => {
  await apply(FARHOD, WRITTEN, 'male');
  farhod = await idOf(FARHOD);
  await (await team(AZIZ)).decide(farhod, { action: 'approve' });
  const trip = await publishTrip(FARHOD, CHILONZOR, URGANCH, 'door');
  const seat = await book(DILDORA, trip, { seats: 1, mode: 'door', ...TO_URGANCH });
  await answer(FARHOD, seat.id, 'confirm');
  await clearBotMessages();
  await openAs(page, 'admin', AZIZ);
  await page.getByText(t('moderation.mine.title'), { exact: true }).click();
  await expect(page.getByText(FARHOD.name, { exact: true })).toBeVisible();
  await shoot(page, WALK, '1-mine');
  await page.getByText(FARHOD.name, { exact: true }).click();
  await expect(mainButton(page)).toHaveText(t('moderation.fixCar'));
  await shoot(page, WALK, '2-approved');
  await mainButton(page).click();
  await page.getByLabel(t('drivers.plate.title')).fill(ON_PHOTO);
  await shoot(page, WALK, '3-fix');
  await mainButton(page).click();
  await expect(page.getByText(t('navbat.application.title', { name: FARHOD.name }))).toBeVisible();
  // The passenger sees the plate of the photo on her seat; the bot told only the driver.
  const passenger = createMarketClient(await signedAs('passenger', DILDORA));
  await expect.poll(async () => (await passenger.trip(trip.id)).driver.car.plate).toBe(ON_PHOTO);
  await expect.poll(async () => (await told(FARHOD)).some((text) => text.includes(fixedWords))).toBe(true);
  expect((await told(DILDORA)).some((text) => text.includes(formatPlate(ON_PHOTO)))).toBe(false);
  await showChat(
    page,
    'driver',
    (await botMessages()).filter((one) => one.chatId === FARHOD.id),
  );
  await page.screenshot({ path: 'screenshots/stand/g95/4-driver-bot.png', fullPage: true });
});

// A new trip waits for «Tasdiqlash»: publishing takes only an approved car (approvedCar, unit tests).
test('T4. a bad photo goes back for a fix; the live trip goes on', async () => {
  await (await team(AZIZ)).decide(farhod, { action: 'request_changes', reasons: ['plate_not_readable'] });
  const mine = await createDriversClient(await signedAs('driver', FARHOD)).getApplication();
  expect(mine?.status).toBe('changes_requested');
  const market = createMarketClient(await signedAs('driver', FARHOD));
  const [live] = (await market.myTrips()).filter((trip) => trip.status === 'active');
  if (!live) throw new Error('g95: the live trip is missing');
  // The time of the trip came: «Yoʻlga chiqdim» still works for the driver of a car under a fix.
  standSql(`UPDATE trips SET depart_at = ${Date.now() - MINUTE} WHERE id = '${live.id}'`);
  expect((await market.departTrip(live.id)).departedAt).not.toBe(null);
});

test('T5. a refusal goes back to «Navbat» by the owner only; the driver hears it', async () => {
  await apply(BOBUR, '01G095BB', 'male');
  const bobur = await idOf(BOBUR);
  await (await team(AZIZ)).decide(bobur, { action: 'reject', reasons: ['plate_not_readable'] });
  expect(await outcome((await team(AZIZ)).reopen(bobur))).toBe('auth.not_owner');
  await (await team(OWNER)).reopen(bobur);
  expect((await (await team(OWNER)).queue()).map((one) => one.userId)).toContain(bobur);
  const reopened = t('bot.driver.reopened');
  await expect.poll(async () => (await told(BOBUR)).some((text) => text.includes(reopened))).toBe(true);
});
