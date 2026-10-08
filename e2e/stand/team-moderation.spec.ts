import { expect, test } from '../crash-guard';
import {
  createChannelsClient,
  createDriversClient,
  createFeedbackClient,
  createMarketClient,
  createModerationClient,
  createPricingClient,
  createStatsClient,
} from '@platform/api-client';
import { CHILONZOR } from './market-kit';
import { confirmedSeat, MINUTE, moveTrip, outcome, SAMARQAND, walletOf } from './g27-kit';
import { JAHONGIR, NARGIZA, OWNER } from './people';
import { apply } from './seed';
import { signedAs, type Person } from './stand-kit';
import { runCron } from './stand-tools';

// The work of the team (docs/79 T12 … T47, docs/78 D07, D08): applications, complaints, prices,
// channels and numbers, through the admin API as the admin Mini App calls it.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const AKMAL: Person = { id: 900601, name: 'Akmal', phone: '998901110601' };
const BAHROM: Person = { id: 900602, name: 'Bahrom', phone: '998901110602' };
const owner = async () => createModerationClient(await signedAs('admin', OWNER));
const applicationOf = async (person: Person) => {
  const moderation = await owner();
  const summary = (await moderation.queue()).find((a) => a.firstName === person.name);
  return summary ? moderation.get(summary.userId) : undefined;
};

test('T16, T12, T14, D07. the same plate is flagged; approved with a fixed plate; decided once', async () => {
  // Akmal sends the plate of Bobur, then the moderator reads another one on the photo.
  await apply(AKMAL, '01G789HI', 'male');
  const application = await applicationOf(AKMAL);
  expect(application?.samePlate).toBeGreaterThan(0);
  const moderation = await owner();
  const id = application?.userId ?? '';
  await moderation.decide(id, { action: 'approve', plate: '01K123LM' });
  expect(await outcome(moderation.decide(id, { action: 'approve' }))).not.toBe('ok');
  const mine = await createDriversClient(await signedAs('driver', AKMAL)).getApplication();
  expect(mine).toMatchObject({ status: 'approved' });
  expect(JSON.stringify(mine)).toContain('01K123LM');
});

test('T13, D08. changes are asked only with a reason; the driver sees what to fix', async () => {
  await apply(BAHROM, '01L234MN', 'male');
  const id = (await applicationOf(BAHROM))?.userId ?? '';
  const moderation = await owner();
  const none = { action: 'request_changes' as const, reasons: [] as never[] };
  expect(await outcome(moderation.decide(id, none))).not.toBe('ok');
  await moderation.decide(id, { action: 'request_changes', reasons: ['front_unclear'] });
  const mine = await createDriversClient(await signedAs('driver', BAHROM)).getApplication();
  expect(mine).toMatchObject({ status: 'changes_requested', reasons: ['front_unclear'] });
});

test('T21, T23, T25. a no-show complaint: a warning and the commission back to the driver', async () => {
  const { trip, seat } = await confirmedSeat(JAHONGIR, NARGIZA);
  moveTrip(trip.id, Date.now() - 10 * HOUR, Date.now() - MINUTE);
  await runCron();
  await (
    await createFeedbackClient(await signedAs('driver', JAHONGIR))
  ).complain({ bookingId: seat.id, reason: 'no_show' });
  const team = createFeedbackClient(await signedAs('admin', OWNER));
  const complaint = (await team.queue()).find((c) => c.tripId === trip.id);
  // The team proposes the refund, the owner confirms it; it goes back to the balances the commission
  // came from (docs/12, docs/35, G63).
  const total = async () => {
    const wallet = await walletOf(JAHONGIR);
    return wallet.main + wallet.bonus;
  };
  const before = await total();
  await team.decide(complaint?.id ?? '', { action: 'warning', refund: true });
  expect(await total()).toBe(before);
  await team.answerRefund(complaint?.id ?? '', 'confirm');
  expect(await total()).toBe(before + seat.commission);
});

test('T40, T41, T46, T47. a formula with a history, a channel added and removed, the numbers', async () => {
  const pricing = createPricingClient(await signedAs('admin', OWNER));
  const market = createMarketClient(await signedAs('passenger', NARGIZA));
  const { current } = await pricing.state();
  const before = (await market.recommend(CHILONZOR, SAMARQAND)).price;
  await pricing.save({ ...current.variables, ratePerKm: current.variables.ratePerKm * 2 });
  expect((await market.recommend(CHILONZOR, SAMARQAND)).price).toBeGreaterThan(before);
  await pricing.rollback(current.version);
  expect((await market.recommend(CHILONZOR, SAMARQAND)).price).toBe(before);
  const channels = createChannelsClient(await signedAs('admin', OWNER));
  const channel = { title: 'Sinov', places: [SAMARQAND] };
  // The stub of Telegram makes the bot an admin everywhere; «not an admin» is a unit test.
  await channels.save('stand_g27_channel', channel);
  expect((await channels.list()).some((c) => c.username === 'stand_g27_channel')).toBe(true);
  await channels.remove('stand_g27_channel');
  expect((await channels.list()).some((c) => c.username === 'stand_g27_channel')).toBe(false);
  expect(await outcome(createStatsClient(await signedAs('admin', OWNER)).get('day'))).toBe('ok');
});
