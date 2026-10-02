import { expect, test } from '@playwright/test';
import {
  createMarketClient,
  createModerationClient,
  createPricingClient,
  createWalletClient,
} from '@platform/api-client';
import { DAY_MS, TRIP_DAYS_AHEAD, tashkentDate } from '@platform/contracts';
import { confirmedSeat, outcome, SAMARQAND } from './g27-kit';
import { CHILONZOR } from './market-kit';
import { AZIZA, BOBUR, KAMRON, OWNER } from './people';
import { signedAs, type Person } from './stand-kit';
import { standSql } from './stand-tools';

// The team (docs/79 T01 … T49): who may do what in the admin Mini App. The owner decides money,
// prices and blocks lifted; a moderator moderates; nobody else gets in.
test.describe.configure({ mode: 'serial' });
const admin = async (person: Person) => signedAs('admin', person);

test.beforeAll(() =>
  standSql(
    `INSERT OR IGNORE INTO team_members (user_id, role, added_by, added_at) ` +
      `VALUES (${KAMRON.id}, 'moderator', ${OWNER.id}, ${Date.now()})`,
  ),
);

test('T01. a person outside the team gets no data of the admin Mini App', async () => {
  expect(await outcome(createModerationClient(await admin(AZIZA)).queue())).toBe('auth.not_admin');
});

test('T42, T43. a price: only the owner sets it, and only within the bounds', async () => {
  const moderator = createPricingClient(await admin(KAMRON));
  const owner = createPricingClient(await admin(OWNER));
  const direction = { from: CHILONZOR, to: SAMARQAND };
  const { maxPrice } = await createMarketClient(await signedAs('passenger', AZIZA)).recommend(
    CHILONZOR,
    SAMARQAND,
  );
  expect(await outcome(moderator.setDirection({ ...direction, price: maxPrice }))).toBe('auth.not_owner');
  expect(await outcome(owner.setDirection({ ...direction, price: maxPrice * 10 }))).toBe(
    'pricing.out_of_bounds',
  );
  expect(await outcome(moderator.save((await owner.state()).current.variables))).toBe('auth.not_owner');
});

test('T24, T28. a moderator blocks; only the owner lifts the block', async () => {
  const { seat } = await confirmedSeat(BOBUR, AZIZA);
  const person = seat.passenger.id;
  const moderator = createModerationClient(await admin(KAMRON));
  const owner = createModerationClient(await admin(OWNER));
  await moderator.block(person, 1);
  expect(await outcome(moderator.unblock(person))).toBe('auth.not_owner');
  await owner.unblock(person);
  const journal = await owner.blocks(person);
  expect(journal.active).toBeNull();
  expect(journal.entries.length).toBeGreaterThan(0);
});

test('T44, T49. a wallet correction never goes below zero; the team sees every trip', async () => {
  const owner = createWalletClient(await admin(OWNER));
  const row = (await owner.all()).find((wallet) => wallet.firstName === BOBUR.name);
  const below = { balance: 'bonus' as const, amount: -((row?.bonus ?? 0) + 1), reason: 'stand G27' };
  expect(await outcome(owner.adjust(row?.driverId ?? '', below))).not.toBe('ok');
  // The team reads the trips day by day, from yesterday to the last day of publishing (docs/90 F-A6).
  const market = createMarketClient(await admin(KAMRON));
  const days = Array.from({ length: TRIP_DAYS_AHEAD + 2 }, (_, index) =>
    tashkentDate(Date.now() + (index - 1) * DAY_MS),
  );
  const trips = (await Promise.all(days.map((day) => market.teamTrips(day)))).flat();
  expect(trips.some((trip) => trip.driver.firstName === BOBUR.name)).toBe(true);
});
