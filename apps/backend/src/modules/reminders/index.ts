import { MINUTE_MS } from '@platform/contracts';
import type { Bindings } from '../../env';
import { confirmedBookings, passengerNewsOf, requestsPastHalf, tellDriver } from '../bookings';
import { notifyMass, scheduleTasks, type TimedTask } from '../notifications';
import { departByCron, tripsDeparting, tripsNotDeparted } from '../trips';
import { watchDepartures } from './application/departures';
import { remindTrips, tellReminder, type TellDeps } from './application/remind';
import { departReminder } from './infrastructure/depart-reminder';
import { createMemoryFirst, d1First } from './infrastructure/reminder-store';
import { reminderOf, reminderTask } from './infrastructure/reminder-task';
import { brandOf } from '../../shared/brand/brand-of';
import { TICK_MINUTES } from '../../shared/cron/tick';

const localFirst = createMemoryFirst();

const tellDeps = (env: Bindings): TellDeps => ({
  trips: (from, to) => tripsDeparting(env, from, to),
  bookings: (tripIds) => confirmedBookings(env, tripIds),
  tell: {
    // The day before: the trip card shows it without sound; 2 hours before: a ring (G68, docs/122).
    passenger: (booking, kind) => passengerNewsOf(env)(booking, kind === 'soon' ? 'soon' : undefined),
    driver: (trip, kind) => tellDriver(env, trip.id, kind === 'soon' ? 'soon' : undefined),
  },
});

// The queue gives a reminder back at its moment (G85 R3, src/index.ts).
export async function runReminderTask(env: Bindings, task: TimedTask): Promise<void> {
  const reminder = reminderOf(task);
  if (reminder) await tellReminder(tellDeps(env), reminder);
}

// The Cron job (every 15 minutes): reminders a day and 2 hours before a trip (G10); a request the
// driver did not answer in half of its time is asked once more (G68, docs/122).
export const sendReminders = async (env: Bindings, now: number) => {
  const first = env.DB ? d1First(env.DB) : localFirst;
  for (const request of await requestsPastHalf(env, now))
    if (await first(`${request.id}:half`)) await tellDriver(env, request.tripId, 'askAgain', request.id);
  const tell = tellDeps(env);
  await remindTrips({
    trips: tell.trips,
    bookings: tell.bookings,
    first,
    schedule: (held) =>
      scheduleTasks(
        env,
        held.map(({ reminder, at }) => ({ task: reminderTask(reminder), at })),
        (task) => runReminderTask(env, task),
      ),
    windowMs: TICK_MINUTES * MINUTE_MS,
    now: () => now,
  });
};

// The Cron job (every 15 minutes): no «Yoʻlga chiqdim» an hour after the time, the driver bot asks
// once; two hours after, the trip is on the road by itself (G63, docs/35).
export const watchLateDepartures = (env: Bindings, now: number) =>
  watchDepartures({
    late: (from, to) => tripsNotDeparted(env, from, to),
    depart: (tripId, at) => departByCron(env, tripId, at),
    first: env.DB ? d1First(env.DB) : localFirst,
    remind: departReminder(brandOf(env), (jobs) => notifyMass(env, jobs)),
    autoDepartHours: brandOf(env).schedule.autoDepartHours,
    now: () => now,
  });
