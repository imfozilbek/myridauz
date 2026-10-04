import { expect, test } from '../crash-guard';
import {
  createCallsClient,
  createChatClient,
  createFeedbackClient,
  createModerationClient,
} from '@platform/api-client';
import { book, CHILONZOR, publishTrip } from './market-kit';
import { confirmedSeat, MINUTE, moveTrip, outcome, SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { KAMRON, OWNER, ROZA, TIMUR } from './people';
import { signedAs } from './stand-kit';
import { runCron, standRows, standSql } from './stand-tools';

// After a ride and around it (docs/77 P49, docs/80 S46, S73, docs/81 A16, docs/79 T26): late stars,
// an old family link, a call before the seat is confirmed, the card of the family, team roles.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const DRIVER = { id: 900605, name: 'Farhod', phone: '998901110605' };

test.beforeAll(async () => {
  const { apply } = await import('./seed');
  await apply(DRIVER, '01R567ST', 'male');
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  const summary = (await moderation.queue()).find((a) => a.firstName === DRIVER.name);
  if (summary) await moderation.decide(summary.userId, { action: 'approve' });
  await runCron();
});

test('S46. no call before the seat is confirmed', async () => {
  const trip = await publishTrip(DRIVER, CHILONZOR, SAMARQAND, 'door');
  const seat = await book(TIMUR, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  expect(await outcome(createCallsClient(await signedAs('passenger', TIMUR)).ice(seat.chatKey))).toBe(
    'calls.not_allowed',
  );
});

test('A16, S73, P49. the family card shows no phone; it closes a day after; stars after 14 days are late', async () => {
  const { trip, seat } = await confirmedSeat(DRIVER, ROZA);
  const chat = createChatClient(await signedAs('passenger', ROZA));
  const token = (await chat.share(seat.id)).link.slice(-43);
  const card = await createChatClient(await signedAs('passenger', TIMUR)).sharedTrip(token);
  expect(JSON.stringify(card)).not.toMatch(/998\d{9}|phone/u);
  moveTrip(trip.id, Date.now() - 16 * DAY, Date.now() - 15 * DAY);
  standSql(`UPDATE bookings SET status = 'completed' WHERE id = '${seat.id}'`);
  expect(await outcome(chat.sharedTrip(token))).not.toBe('ok');
  const late = { bookingId: seat.id, stars: 5 };
  expect(await outcome(createFeedbackClient(await signedAs('passenger', ROZA)).review(late))).toBe(
    'reviews.too_late',
  );
});

test('T26. a moderator does not block a member of the team', async () => {
  standSql(
    `INSERT OR IGNORE INTO team_members (user_id, role, added_by, added_at) VALUES (${KAMRON.id}, 'moderator', ${OWNER.id}, ${Date.now()})`,
  );
  const [row] = standRows(`SELECT public_id FROM users WHERE id = ${OWNER.id}`);
  const moderator = createModerationClient(await signedAs('admin', KAMRON));
  expect(await outcome(moderator.block(String(row?.['public_id']), 1))).not.toBe('ok');
});
