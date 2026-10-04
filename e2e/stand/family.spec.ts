import { expect, test } from '../crash-guard';
import { createChatClient } from '@platform/api-client';
import { MAX_FOLLOWERS } from '@platform/contracts';
import { confirmedSeat, MINUTE, moveTrip, outcome, toldBy, wordsOf } from './g27-kit';
import { MALIKA, OYBEK } from './people';
import { signedAs, type Person } from './stand-kit';

// The close ones of a passenger (docs/43, docs/80 S70 … S74): a link without Rida, up to 5 close
// ones who hear the boarding and the arrival, and a link that stops.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
// People with Telegram but without Rida: a mother, a brother, friends.
const closeOnes: Person[] = Array.from({ length: MAX_FOLLOWERS + 1 }, (_, i) => ({
  id: 900401 + i,
  name: `Yaqin ${i + 1}`,
  phone: `99890111040${i + 1}`,
}));
const chatOf = async (person: Person) => createChatClient(await signedAs('passenger', person));
// The link ends with the token: t.me/<bot>?start=<prefix><token>.
const TOKEN_LENGTH = 43;
const tokenOf = (link: string) => link.slice(-TOKEN_LENGTH);

test('S70, S71, S72, P43, S74. close ones follow the ride, the sixth has no place, the link stops', async () => {
  const { trip, seat } = await confirmedSeat(OYBEK, MALIKA);
  const passenger = await chatOf(MALIKA);
  const token = tokenOf((await passenger.share(seat.id)).link);
  const [mother] = closeOnes;
  const card = await (await chatOf(mother ?? MALIKA)).sharedTrip(token);
  expect(card).toMatchObject({ passengerName: MALIKA.name, status: 'waiting' });
  const answers = [];
  for (const person of closeOnes) answers.push(await outcome((await chatOf(person)).follow(token)));
  expect(answers.slice(0, MAX_FOLLOWERS).every((answer) => answer === 'ok')).toBe(true);
  expect(answers.at(-1)).toBe('shares.too_many');
  // The trip leaves: «Mashinaga chiqdim», then «Yetib keldim».
  moveTrip(trip.id, Date.now() - 5 * MINUTE, Date.now() + 6 * HOUR);
  await passenger.boarded(seat.id);
  await passenger.arrived(seat.id);
  for (const person of closeOnes.slice(0, MAX_FOLLOWERS)) {
    await toldBy('passenger', person, wordsOf('bot.share.boarded'));
    await toldBy('passenger', person, wordsOf('bot.share.arrived'));
  }
  await passenger.stopSharing(seat.id);
  expect(await outcome((await chatOf(closeOnes[1] ?? MALIKA)).sharedTrip(token))).toBe('shares.not_found');
});
