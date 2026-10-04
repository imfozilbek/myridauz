import { expect, test } from '../crash-guard';
import {
  createChatClient,
  createDriversClient,
  createModerationClient,
  createSubscriptionsClient,
  createUsersClient,
} from '@platform/api-client';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import {
  askRide,
  driverSeatOf,
  outcome,
  SAMARQAND,
  toldBy,
  TO_SAMARQAND,
  tomorrow,
  walletOf,
  wordsOf,
} from './g27-kit';
import { OWNER, ROZA } from './people';
import { apply, PHOTO } from './seed';
import { signedAs, type Person } from './stand-kit';
import { runCron, standSql } from './stand-tools';

// A driver after the approval (docs/78 D09 … D74, docs/81 V08): a new car or face goes to the check
// again, the bonus has its time, a subscription brings requests, the family follows a trip.
test.describe.configure({ mode: 'serial' });
const DAVRON: Person = { id: 900603, name: 'Davron', phone: '998901110603' };
const ELYOR: Person = { id: 900604, name: 'Elyor', phone: '998901110604' };

async function approved(person: Person, plate: string) {
  await apply(person, plate, 'male');
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  const summary = (await moderation.queue()).find((a) => a.firstName === person.name);
  if (summary) await moderation.decide(summary.userId, { action: 'approve' });
  await runCron();
}

test('D09, D10. a new face after the approval: back to the check, no publishing until then', async () => {
  await approved(DAVRON, '01P345QR');
  expect(await outcome(publishTrip(DAVRON, CHILONZOR, SAMARQAND, 'door'))).toBe('ok');
  await createUsersClient(await signedAs('driver', DAVRON)).uploadAvatar(PHOTO);
  const application = await createDriversClient(await signedAs('driver', DAVRON)).getApplication();
  expect(application?.status).toBe('pending');
  expect(await outcome(publishTrip(DAVRON, CHILONZOR, SAMARQAND, 'door'))).toBe('trips.not_driver');
});

test('D70, D71, V08. the bonus lives until its time; burnt, it no longer pays a commission', async () => {
  await approved(ELYOR, '01Q456RS');
  const wallet = await walletOf(ELYOR);
  expect(wallet.bonus).toBeGreaterThan(0);
  expect(wallet.bonusExpiresAt).not.toBeNull();
  const trip = await publishTrip(ELYOR, CHILONZOR, SAMARQAND, 'door');
  const seat = await book(ROZA, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  standSql(`UPDATE wallet_operations SET expires_at = ${Date.now() - 60_000} WHERE driver_id = ${ELYOR.id}`);
  await runCron();
  await expect.poll(async () => (await walletOf(ELYOR)).bonus).toBe(0);
  expect((await walletOf(ELYOR)).operations.some((op) => op.kind === 'bonus_expired')).toBe(true);
  expect(await outcome(answer(ELYOR, seat.id, 'confirm'))).toBe('wallet.not_enough');
  expect((await driverSeatOf(ELYOR, seat.id))?.status).toBe('requested');
});

test('D66, D74. a subscription to requests brings a new one; the family follows the trip', async () => {
  const route = { from: CHILONZOR, to: SAMARQAND, woman: false, date: tomorrow() };
  await createSubscriptionsClient(await signedAs('driver', ELYOR)).subscribe(route);
  await askRide(ROZA);
  await toldBy('driver', ELYOR, wordsOf('bot.subscription.request'));
  const trip = await publishTrip(ELYOR, CHILONZOR, SAMARQAND, 'door');
  const share = await createChatClient(await signedAs('driver', ELYOR)).shareTrip(trip.id);
  const card = await createChatClient(await signedAs('passenger', ROZA)).sharedTrip(share.link.slice(-43));
  expect(card.driver.firstName).toBe(ELYOR.name);
});
