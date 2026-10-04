import { expect, test } from '../crash-guard';
import { createModerationClient, createSubscriptionsClient, createUsersClient } from '@platform/api-client';
import { MAX_SUBSCRIPTIONS } from '@platform/contracts';
import { CHILONZOR, publishTrip } from './market-kit';
import {
  confirmedSeat,
  driverSeatOf,
  outcome,
  SAMARQAND,
  toldBy,
  tomorrow,
  walletOf,
  wordsOf,
} from './g27-kit';
import { BOBUR, DIYORA, LAZIZA, NIGORA, OWNER, SEVARA } from './people';
import { signedAs } from './stand-kit';

// People who leave and people who wait (docs/81 F07, F08, docs/77 P70, P72): a deleted account and
// a block cancel the seats with a word to the driver and the money back; a subscription brings
// the new trip of the route.
test.describe.configure({ mode: 'serial' });

test('P09, F07. a deleted account with a seat: the seat is cancelled, the driver hears, money is back', async () => {
  const before = await walletOf(NIGORA);
  const { seat } = await confirmedSeat(NIGORA, LAZIZA);
  await createUsersClient(await signedAs('passenger', LAZIZA)).deleteMe();
  await toldBy('driver', NIGORA, wordsOf('bot.booking.cancelledByPassenger'));
  // The data of a deleted person goes (docs/30): the seat is no longer a confirmed one.
  expect((await driverSeatOf(NIGORA, seat.id))?.status).not.toBe('confirmed');
  expect((await walletOf(NIGORA)).bonus).toBe(before.bonus);
});

test('F08, T24. a block in the middle: the seat is cancelled, the driver hears, money is back', async () => {
  const before = await walletOf(NIGORA);
  const { seat } = await confirmedSeat(NIGORA, DIYORA);
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  await moderation.block(seat.passenger.id, 7);
  expect((await driverSeatOf(NIGORA, seat.id))?.status).toBe('cancelled_by_passenger');
  await toldBy('driver', NIGORA, wordsOf('bot.booking.cancelledByPassenger'));
  expect((await walletOf(NIGORA)).bonus).toBe(before.bonus);
});

test('P70, P72. a subscription brings the new trip of the route; the sixth is refused', async () => {
  const subscriptions = createSubscriptionsClient(await signedAs('passenger', SEVARA));
  const route = { from: CHILONZOR, to: SAMARQAND, woman: false };
  await subscriptions.subscribe({ ...route, date: tomorrow() });
  await publishTrip(BOBUR, CHILONZOR, SAMARQAND, 'door');
  await toldBy('passenger', SEVARA, wordsOf('bot.subscription.trip'));
  const others = [CHILONZOR, '1703401', '1710401', '1714401', '1735401'].slice(0, MAX_SUBSCRIPTIONS);
  const answers = [];
  for (const from of others.slice(1))
    answers.push(await outcome(subscriptions.subscribe({ ...route, from, date: null })));
  expect(answers.every((answer) => answer === 'ok')).toBe(true);
  const sixth = { ...route, from: '1706401', date: null };
  expect(await outcome(subscriptions.subscribe(sixth))).toBe('subscriptions.too_many');
});
