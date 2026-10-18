import type { Booking, Trip } from '@platform/contracts';
import {
  REMINDER_HORIZON_MS,
  REMINDER_KINDS,
  reminderAt,
  spreadMoments,
  type ReminderKind,
} from '../domain/due';

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
  if (held.length === 0) return;
  // Many reminders of one moment (08:00, a round hour) go a few a second, not all at once (G85 T6).
  const sorted = [...held].sort((one, other) => one.at - other.at);
  const moments = spreadMoments(sorted.map(({ at }) => at));
  await deps.schedule(sorted.map((item, index) => ({ ...item, at: moments[index] ?? item.at })));
}

// The statuses of a trip that still goes.
const GOING: readonly Trip['status'][] = ['active', 'full'];

export type TellDeps = {
  readonly trip: (id: string) => Promise<Trip | undefined>;
  readonly bookings: RemindersDeps['bookings'];
  readonly schedule: RemindersDeps['schedule'];
  readonly tell: {
    passenger(booking: Booking, kind: ReminderKind): Promise<void>;
    driver(trip: Trip, kind: ReminderKind): Promise<void>;
  };
  readonly now: () => number;
};

// At its moment a reminder reads the trip again: a cancelled trip, a trip left without riders and a
// cancelled booking remind nobody. A trip the driver moved is reminded at the moment of its new time.
export async function tellReminder(deps: TellDeps, reminder: Reminder): Promise<void> {
  const trip = await deps.trip(reminder.tripId);
  if (!trip || !GOING.includes(trip.status)) return;
  if (trip.departAt !== reminder.departAt) {
    const at = reminderAt(trip.departAt, reminder.kind, deps.now());
    if (at !== null) await deps.schedule([{ reminder: { ...reminder, departAt: trip.departAt }, at }]);
    return;
  }
  const riders = await deps.bookings([trip.id]);
  if (reminder.bookingId === undefined) {
    if (riders.length > 0) await deps.tell.driver(trip, reminder.kind);
    return;
  }
  const booking = riders.find((one) => one.id === reminder.bookingId);
  if (booking) await deps.tell.passenger(booking, reminder.kind);
}
