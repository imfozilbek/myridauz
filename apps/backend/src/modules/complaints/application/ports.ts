import type { HistoryLine } from '../../chat';
import type { ComplaintRecord } from '../domain/complaint';

// A ride as the complaints see it: set by the app from the bookings module (module-events.ts).
export type Ride = {
  readonly bookingId: string;
  readonly tripId: string;
  readonly driverId: number;
  readonly passengerId: number;
  readonly departAt: number;
  // The end of the trip: a complaint is taken COMPLAIN_DAYS after it (docs/129).
  readonly endsAt: number;
  readonly commission: number;
  readonly chatKey: string;
};
export type Side = 'driver' | 'passenger';

export type ComplaintStore = {
  save(complaint: ComplaintRecord): Promise<void>;
  // Writes the decision only if nobody decided before: two moderators at once, one decision (docs/65 A4).
  resolve(complaint: ComplaintRecord): Promise<boolean>;
  find(id: string): Promise<ComplaintRecord | undefined>;
  ofAuthor(authorId: number, bookingId: string): Promise<ComplaintRecord | undefined>;
  open(): Promise<ComplaintRecord[]>;
  against(userIds: readonly number[], since: number): Promise<ComplaintRecord[]>;
  countAgainst(userId: number): Promise<number>;
  logChatRead(complaintId: string, moderatorId: number, at: number): Promise<void>;
  // The refunds of no-shows (docs/35, G63): the ones waiting for the owner, the complaints of an
  // author about these rides, and the owner's answer, written only while the refund is proposed.
  refundsProposed(): Promise<ComplaintRecord[]>;
  ofAuthorRides(authorId: number, bookingIds: readonly string[]): Promise<ComplaintRecord[]>;
  answerRefund(complaint: ComplaintRecord): Promise<boolean>;
};

// What people get from the bots (docs/17): the author never learns the decision itself.
export type ComplaintTeller = {
  // The team sees the public id, never the Telegram ID (docs/65 A3).
  team(complaint: ComplaintRecord, against: { firstName: string; publicId: string }): Promise<void>;
  warning(userId: number, side: Side): Promise<void>;
  blocked(userId: number, side: Side, until: number | null): Promise<void>;
  resolved(userId: number, side: Side): Promise<void>;
};

export type ComplaintsDeps = {
  readonly store: ComplaintStore;
  // A ride to complain about; the ride of a filed complaint, even after a later cancel.
  readonly ride: (bookingId: string) => Promise<Ride | undefined>;
  readonly filedRide: (bookingId: string) => Promise<Ride | undefined>;
  readonly people: {
    find(
      id: number,
    ): Promise<
      { readonly publicId: string; readonly firstName: string; readonly avatarKey: string | null } | undefined
    >;
    // The Telegram ID behind a public id from an admin path (docs/65 A3).
    idOf(publicId: string): Promise<number | undefined>;
    block(
      id: number,
      days: number | null,
      cause: { readonly by: number; readonly reason: string },
    ): Promise<void>;
    releasePhone(id: number): Promise<void>;
    // Only the owner lifts a block; the journal keeps every step (docs/65 C).
    unblock(id: number, cause: { readonly by: number; readonly reason: string }): Promise<void>;
    blocks(id: number): Promise<{
      readonly active: { readonly until: number | null } | null;
      readonly entries: readonly { until: number | null; by: number; reason: string; at: number }[];
    }>;
  };
  // A member of the team is blocked only by the owner (docs/02).
  readonly isTeam: (userId: number) => Promise<boolean>;
  // How many trips a person drove or rode: the history for the moderator.
  readonly trips: (userId: number, side: Side) => Promise<number>;
  readonly chat: (key: string) => Promise<HistoryLine[]>;
  readonly forgetChat: (key: string) => Promise<void>;
  readonly cancelAll: (userId: number) => Promise<void>;
  // The owner confirmed: the commission of the booking goes back once (docs/35).
  readonly refund: (ownerId: number, driverId: number, bookingId: string) => Promise<'ok' | 'nothing'>;
  readonly tell: ComplaintTeller;
  readonly now: () => number;
  readonly newId: () => string;
};
