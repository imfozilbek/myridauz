import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import { confirmedBookings } from '../bookings';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { tripsDeparting } from '../trips';
import { remindTrips } from './application/remind';
import { botReminders } from './infrastructure/bot-reminders';
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
    }),
    now: () => now,
  });
