import { expect, test } from '../crash-guard';
import { createFeedbackClient, createMarketClient } from '@platform/api-client';
import { botMessages, clearBotMessages, runCron } from './stand-tools';
import { confirmedSeat, MINUTE, moveTrip, outcome, toldBy, wordsOf } from './g27-kit';
import { BOBUR, FERUZA, MALIKA } from './people';
import { signedAs, type Person } from './stand-kit';

// What Rida does by itself every 15 minutes (docs/80 S20, S27, S29) and what follows a ride: the
// stars both ways, the blind reviews, one complaint per booking (docs/77 P47 … P50).
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const feedbackOf = async (app: 'passenger' | 'driver', person: Person) =>
  createFeedbackClient(await signedAs(app, person));

test('S20, S29, P48, P50. a ride that ended: completed, both asked for stars, reviews blind until both', async () => {
  const { trip, seat } = await confirmedSeat(BOBUR, FERUZA);
  moveTrip(trip.id, Date.now() - 10 * HOUR, Date.now() - MINUTE);
  await clearBotMessages();
  await runCron();
  const market = createMarketClient(await signedAs('driver', BOBUR));
  await expect.poll(async () => (await market.trip(trip.id)).status).toBe('completed');
  await toldBy('passenger', FERUZA, wordsOf('bot.rating.ask'));
  await toldBy('driver', BOBUR, wordsOf('bot.rating.ask'));
  // Feruza rates first: the review waits for Bobur's (docs/24).
  const passenger = await feedbackOf('passenger', FERUZA);
  await passenger.review({ bookingId: seat.id, stars: 5, text: 'Yaxshi haydovchi' });
  const driverId = trip.driver.id;
  expect((await passenger.reviewsOf(driverId)).reviews).toHaveLength(0);
  await (await feedbackOf('driver', BOBUR)).review({ bookingId: seat.id, stars: 5 });
  await expect.poll(async () => (await passenger.reviewsOf(driverId)).reviews.length).toBe(1);
  // One complaint per booking (docs/17).
  const complaint = { bookingId: seat.id, reason: 'unsafe_driving' as const };
  expect(await outcome(passenger.complain(complaint))).toBe('ok');
  expect(await outcome(passenger.complain(complaint))).toBe('complaints.already');
});

test('S27. 2 hours before: the passenger and the driver are reminded once', async () => {
  const { trip } = await confirmedSeat(BOBUR, MALIKA);
  moveTrip(trip.id, Date.now() + 90 * MINUTE, Date.now() + 10 * HOUR);
  await clearBotMessages();
  await runCron();
  await toldBy('passenger', MALIKA, wordsOf('bot.ring.soonDoor'));
  await toldBy('driver', BOBUR, wordsOf('bot.dring.soon'));
  await runCron();
  const soon = wordsOf('bot.ring.soonDoor');
  const reminders = (await botMessages()).filter((m) => m.chatId === MALIKA.id && m.text.includes(soon));
  expect(reminders).toHaveLength(1);
});
