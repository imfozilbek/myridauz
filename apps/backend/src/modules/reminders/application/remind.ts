import type { Booking, Trip } from '@platform/contracts';
import { REMINDER_HORIZON_MS, REMINDER_KINDS, reminderAt, type ReminderKind } from '../domain/due';

// A reminder waiting in the queue for its moment (G85 R3): the trip at the time it was found; the
// booking of a passenger, none for the driver.
export type Reminder = {
  readonly kind: ReminderKind;
  readonly tripId: string;
  readonly departAt: number;
  readonly bookingId?: string;
};

export type RemindersDeps = {
  readonly trips: (from: number, to: number) => Promise<readonly Trip[]>;
  readonly bookings: (tripIds: readonly string[]) => Promise<readonly Booking[]>;
  // True the first time a key is seen: each reminder goes once.
  readonly first: (key: string) => Promise<boolean>;
  // Holds the reminders until their moments.
  readonly schedule: (
    reminders: readonly { readonly reminder: Reminder; readonly at: number }[],
  ) => Promise<void>;
  // The minutes between two runs of the Cron: the reminders of the next run are held already.
  readonly windowMs: number;
  readonly now: () => number;
};

// The Cron job: passengers with a confirmed seat and their driver hear about the trip a day and
// 2 hours before it (G10), at the minute, not at the next run of the Cron (G85 R3). A trip without
// riders reminds nobody.
export async function remindTrips(deps: RemindersDeps): Promise<void> {
  const now = deps.now();
  const until = now + deps.windowMs;
  const trips = await deps.trips(now, until + REMINDER_HORIZON_MS);
  const due = trips.flatMap((trip) =>
    REMINDER_KINDS.flatMap((kind) => {
      const at = reminderAt(trip.departAt, kind, now);
      return at !== null && at <= until ? [{ trip, kind, at }] : [];
    }),
  );
  if (due.length === 0) return;
  const bookings = await deps.bookings(due.map(({ trip }) => trip.id));
  const held: { reminder: Reminder; at: number }[] = [];
  for (const { trip, kind, at } of due) {
    const riders = bookings.filter((booking) => booking.trip.id === trip.id);
    if (riders.length === 0) continue;
    const base = { kind, tripId: trip.id, departAt: trip.departAt };
    for (const booking of riders)
      if (await deps.first(`${booking.id}:${kind}`))
        held.push({ reminder: { ...base, bookingId: booking.id }, at });
    if (await deps.first(`${trip.id}:${kind}:driver`)) held.push({ reminder: base, at });
  }
  if (held.length > 0) await deps.schedule(held);
}

export type TellDeps = {
  readonly trips: RemindersDeps['trips'];
  readonly bookings: RemindersDeps['bookings'];
  readonly tell: {
    passenger(booking: Booking, kind: ReminderKind): Promise<void>;
    driver(trip: Trip, kind: ReminderKind): Promise<void>;
  };
};

// At its moment a reminder reads the trip again: a trip cancelled, moved or left without riders, and
// a booking cancelled, remind nobody.
export async function tellReminder(deps: TellDeps, reminder: Reminder): Promise<void> {
  const trip = (await deps.trips(reminder.departAt, reminder.departAt + 1)).find(
    (one) => one.id === reminder.tripId,
  );
  if (!trip) return;
  const riders = await deps.bookings([trip.id]);
  if (reminder.bookingId === undefined) {
    if (riders.length > 0) await deps.tell.driver(trip, reminder.kind);
    return;
  }
  const booking = riders.find((one) => one.id === reminder.bookingId);
  if (booking) await deps.tell.passenger(booking, reminder.kind);
}
