import { createFeedbackClient, createTeamClient } from '@platform/api-client';
import { say } from './bot-kit';
import { askRide, confirmedSeat, MINUTE, moveTrip, offerInto, TO_SAMARQAND } from './g27-kit';
import { book } from './market-kit';
import { OWNER } from './people';
import { apply, approvedDriver, register } from './seed';
import { signedAs, type Person } from './stand-kit';
import { runCron, standRows } from './stand-tools';

// The people of the walk of the screens (G91), each in one state of the way: the robot opens the app
// as each of them. Every file of the walk runs on its own stand and makes its people there.
export const NEW: Person = { id: 900961, name: 'Yulduz', phone: '998901110961' };
export const FRESH: Person = { id: 900962, name: 'Shirin', phone: '998901110962' };
export const RIDER: Person = { id: 900963, name: 'Mohira', phone: '998901110963' };
export const ASKER: Person = { id: 900964, name: 'Ozoda', phone: '998901110964' };
export const DONE: Person = { id: 900965, name: 'Sabina', phone: '998901110965' };
export const WAITER: Person = { id: 900966, name: 'Iroda', phone: '998901110966' };
export const NEW_DRIVER: Person = { id: 900971, name: 'Botir', phone: '998901110971' };
export const DRIVER: Person = { id: 900972, name: 'Davron', phone: '998901110972' };
export const PAST_DRIVER: Person = { id: 900973, name: 'Ergash', phone: '998901110973' };
const APPLICANT: Person = { id: 900974, name: 'Ilhom', phone: '998901110974' };
export const MODERATOR: Person = { id: 900975, name: 'Nodir', phone: '998901110975' };
const ASKING: Person = { id: 900967, name: 'Xurshida', phone: '998901110967' };
export { OWNER };
const HOUR = 60 * MINUTE;

// A trip of tomorrow with a confirmed seat (Mohira) and a seat that waits for the driver (Iroda).
export async function seatsOfTomorrow() {
  for (const person of [RIDER, WAITER]) await register('passenger', person, 'female');
  await approvedDriver(DRIVER, '90A921BC');
  const { trip, seat } = await confirmedSeat(DRIVER, RIDER);
  await book(WAITER, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  return { trip, seat };
}

// A request of Ozoda with an offer of the driver into his trip.
export async function requestWithOffer() {
  const { trip } = await seatsOfTomorrow();
  await register('passenger', ASKER, 'female');
  await offerInto(DRIVER, (await askRide(ASKER)).id, trip);
}

// A ride that ended an hour ago: the review, the complaint, «Yana … bilan».
export async function rideOfToday() {
  await register('passenger', DONE, 'female');
  await approvedDriver(PAST_DRIVER, '90A922BC');
  const ended = await confirmedSeat(PAST_DRIVER, DONE);
  moveTrip(ended.trip.id, Date.now() - 6 * HOUR, Date.now() - HOUR);
  await runCron();
  return ended;
}

// Work for the team: an application, a complaint, a question to the support, and a moderator.
export async function casesOfTeam() {
  await apply(APPLICANT, '90A923BC', 'male');
  const { seat } = await rideOfToday();
  await createFeedbackClient(await signedAs('passenger', DONE)).complain({
    bookingId: seat.id,
    reasons: ['price_changed'],
  });
  await register('passenger', ASKING, 'female');
  await say('support', ASKING, 'Safar topa olmayapman');
  await register('passenger', MODERATOR, 'male');
  const [moderator] = standRows(`SELECT public_id FROM users WHERE id = ${MODERATOR.id}`);
  await createTeamClient(await signedAs('admin', OWNER)).add(String(moderator?.['public_id']));
}
