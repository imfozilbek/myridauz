import type { Booking, Trip } from '@platform/contracts';
import { dueReminder, REMINDER_HORIZON_MS, type ReminderKind } from '../domain/due';

export type RemindersDeps = {
  readonly trips: (from: number, to: number) => Promise<readonly Trip[]>;
  readonly bookings: (tripIds: readonly string[]) => Promise<readonly Booking[]>;
  // True the first time a key is seen: each reminder goes once.
  readonly first: (key: string) => Promise<boolean>;
  readonly tell: {
    passenger(booking: Booking, kind: ReminderKind): Promise<void>;
    driver(trip: Trip, kind: ReminderKind): Promise<void>;
  };
  readonly now: () => number;
};

// The Cron job: passengers with a confirmed seat and their driver hear about the trip a day and
// 2 hours before it (G10). A trip without riders reminds nobody.
export async function remindTrips(deps: RemindersDeps): Promise<void> {
  const now = deps.now();
  const trips = await deps.trips(now, now + REMINDER_HORIZON_MS);
  const due = trips.flatMap((trip) => {
    const kind = dueReminder(trip.departAt, now);
    return kind ? [{ trip, kind }] : [];
  });
  if (due.length === 0) return;
  const bookings = await deps.bookings(due.map(({ trip }) => trip.id));
  for (const { trip, kind } of due) {
    const riders = bookings.filter((booking) => booking.trip.id === trip.id);
    if (riders.length === 0) continue;
    for (const booking of riders)
      if (await deps.first(`${booking.id}:${kind}`)) await deps.tell.passenger(booking, kind);
    if (await deps.first(`${trip.id}:${kind}:driver`)) await deps.tell.driver(trip, kind);
  }
}
