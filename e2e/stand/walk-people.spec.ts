import { expect, test } from '../crash-guard';
import { askRide, confirmedSeat, MINUTE, moveTrip, offerInto, TO_SAMARQAND } from './g27-kit';
import { book } from './market-kit';
import { NARROW } from './screen-tour';
import { approvedDriver, register } from './seed';
import type { Person } from './stand-kit';
import { runCron } from './stand-tools';
import { WALK_MS, WALKING, walkAs } from './walk-report';

// The walk of the screens (G90): the robot opens each Mini App as a person in one state of the
// way and taps everything it reaches. Every finding goes to screenshots/stand/walk/<name>.md.
test.skip(!WALKING, 'the walk runs on its own fresh stand: pnpm stand:walk (docs/75)');
test.use({ viewport: NARROW, actionSheets: 'keep' });
test.describe.configure({ mode: 'serial' });

const NEW: Person = { id: 900921, name: 'Yulduz', phone: '998901110921' };
const FRESH: Person = { id: 900922, name: 'Shirin', phone: '998901110922' };
const RIDER: Person = { id: 900923, name: 'Mohira', phone: '998901110923' };
const ASKER: Person = { id: 900924, name: 'Ozoda', phone: '998901110924' };
const DONE: Person = { id: 900925, name: 'Sabina', phone: '998901110925' };
const WAITER: Person = { id: 900926, name: 'Iroda', phone: '998901110926' };
const NEW_DRIVER: Person = { id: 900931, name: 'Botir', phone: '998901110931' };
const DRIVER: Person = { id: 900932, name: 'Davron', phone: '998901110932' };
const PAST_DRIVER: Person = { id: 900933, name: 'Ergash', phone: '998901110933' };
const HOUR = 60 * MINUTE;

test.beforeAll(async () => {
  for (const person of [FRESH, RIDER, ASKER, DONE, WAITER]) await register('passenger', person, 'female');
  await approvedDriver(DRIVER, '90A921BC');
  await approvedDriver(PAST_DRIVER, '90A922BC');
  // A ride that ended an hour ago: the review, the complaint, «Yana … bilan».
  const ended = await confirmedSeat(PAST_DRIVER, DONE);
  moveTrip(ended.trip.id, Date.now() - 6 * HOUR, Date.now() - HOUR);
  await runCron();
  // A confirmed seat of tomorrow, a seat waiting for the driver, and a request with an offer.
  const { trip } = await confirmedSeat(DRIVER, RIDER);
  await book(WAITER, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  await offerInto(DRIVER, (await askRide(ASKER)).id, trip);
});

const PEOPLE: readonly [string, 'passenger' | 'driver', Person][] = [
  ['passenger-new', 'passenger', NEW],
  ['passenger-fresh', 'passenger', FRESH],
  ['passenger-seat', 'passenger', RIDER],
  ['passenger-waiting', 'passenger', WAITER],
  ['passenger-request', 'passenger', ASKER],
  ['passenger-after-ride', 'passenger', DONE],
  ['driver-new', 'driver', NEW_DRIVER],
  ['driver-trip', 'driver', DRIVER],
  ['driver-after-ride', 'driver', PAST_DRIVER],
];

for (const [name, app, person] of PEOPLE)
  test(`${name}: every screen has a way out and every tap does something`, async ({ page }) => {
    test.setTimeout(WALK_MS);
    const report = await walkAs(page, name, app, person);
    expect.soft(report.findings).toEqual([]);
  });
