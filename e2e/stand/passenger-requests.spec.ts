import { expect, test } from '../crash-guard';
import { createMarketClient } from '@platform/api-client';
import { CHILONZOR, publishTrip } from './market-kit';
import {
  answerOffer,
  askRide,
  dayAfterTomorrow,
  myBookings,
  offerOn,
  outcome,
  SAMARQAND,
  tailOf,
  toldBy,
  wordsOf,
} from './g27-kit';
import { BOBUR, MALIKA, NIGORA, RUSTAM, TIMUR } from './people';
import { signedAs } from './stand-kit';
import { runCron, standSql } from './stand-tools';

// The second way of a passenger (docs/77 P60 … P65, docs/83 N09): a request for a day, offers of
// drivers, accept or decline. Toshkent → Samarqand.
test.describe.configure({ mode: 'serial' });
const requestOf = async (passenger: typeof TIMUR, id: string) =>
  (await createMarketClient(await signedAs('passenger', passenger)).myRequests()).find((r) => r.id === id);

test('P60, P61, P62. a request, an offer by the bot, accepted: a confirmed seat at once', async () => {
  const request = await askRide(TIMUR);
  const offer = await offerOn(BOBUR, request.id);
  await toldBy('passenger', TIMUR, wordsOf('bot.ring.offer'));
  const { bookingId } = await answerOffer(TIMUR, offer.id, 'accept');
  const seat = (await myBookings(TIMUR)).find((booking) => booking.id === bookingId);
  expect(seat?.status).toBe('confirmed');
  await toldBy('driver', BOBUR, tailOf('bot.dring.offerAccepted'));
  expect((await requestOf(TIMUR, request.id))?.status).toBe('matched');
});

test('P63. a declined offer: the driver hears it', async () => {
  const request = await askRide(MALIKA);
  const offer = await offerOn(NIGORA, request.id);
  await answerOffer(MALIKA, offer.id, 'decline');
  await toldBy('driver', NIGORA, wordsOf('bot.offer.declined'));
  expect((await requestOf(MALIKA, request.id))?.status).toBe('open');
});

test('P65. a cancelled request takes no more offers', async () => {
  const request = await askRide(MALIKA);
  await createMarketClient(await signedAs('passenger', MALIKA)).cancelRequest(request.id);
  // The request changed while the driver looked: the board loads again (G89 U7).
  expect(await outcome(offerOn(BOBUR, request.id))).toBe('bookings.wrong_status');
});

test('P64, S21. a request of a day that is over expires by the Cron', async () => {
  const request = await askRide(TIMUR);
  standSql(`UPDATE ride_requests SET expires_at = ${Date.now() - 60_000} WHERE id = '${request.id}'`);
  await runCron();
  await expect.poll(async () => (await requestOf(TIMUR, request.id))?.status).toBe('expired');
});

// One live trip of a driver (owner decision 12.10.2026, docs/172): a second trip on another day and
// an offer without that trip are refused.
test('N09. a driver with a live trip hears it before offering', async () => {
  const request = await askRide(MALIKA, dayAfterTomorrow());
  const publish = (days: number) => outcome(publishTrip(RUSTAM, CHILONZOR, SAMARQAND, 'door', days));
  expect(await publish(1)).toBe('ok');
  expect(await publish(3)).toBe('trips.too_many');
  expect(await outcome(offerOn(RUSTAM, request.id, dayAfterTomorrow()))).toBe('trips.too_many');
});
