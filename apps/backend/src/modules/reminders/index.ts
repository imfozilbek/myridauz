import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import { peopleOf } from '../users';
import { confirmedBookings } from '../bookings';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { departByCron, tripsDeparting, tripsNotDeparted } from '../trips';
import { watchDepartures } from './application/departures';
import { remindTrips } from './application/remind';
import { botReminders } from './infrastructure/bot-reminders';
import { departReminder } from './infrastructure/depart-reminder';
import { createMemoryFirst, d1First } from './infrastructure/reminder-store';

const localFirst = createMemoryFirst();

// The Cron job (every 15 minutes): reminders a day and 2 hours before a trip (G10).
export const sendReminders = (env: Bindings, now: number) =>
  remindTrips({
    trips: (from, to) => tripsDeparting(env, from, to),
    bookings: (tripIds) => confirmedBookings(env, tripIds),
    first: env.DB ? d1First(env.DB) : localFirst,
    tell: botReminders({
      brand: loadBrand(env.BRAND),
      placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
      send: (jobs) => notify(env, jobs),
      telegramId: (publicId) => peopleOf(env).idOf(publicId),
    }),
    now: () => now,
  });

// The Cron job (every 15 minutes): no «Yoʻlga chiqdim» an hour after the time, the driver bot asks
// once; two hours after, the trip is on the road by itself (G63, docs/35).
export const watchLateDepartures = (env: Bindings, now: number) =>
  watchDepartures({
    late: (from, to) => tripsNotDeparted(env, from, to),
    depart: (tripId, at) => departByCron(env, tripId, at),
    first: env.DB ? d1First(env.DB) : localFirst,
    remind: departReminder(loadBrand(env.BRAND), (jobs) => notify(env, jobs)),
    now: () => now,
  });
