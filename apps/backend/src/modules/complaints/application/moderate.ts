import type { Complaint, complaintDecisionSchema } from '@platform/contracts';
import type { z } from 'zod';
import { isHigh, queueOrder, type ComplaintRecord } from '../domain/complaint';
import { blockPerson } from './block';
import type { ComplaintsDeps, Ride, Side } from './ports';

// Who decides: a moderator, or the owner who may also block a member of the team.
export type Moderator = { readonly id: number; readonly owner: boolean };

type Decision = z.output<typeof complaintDecisionSchema>;
const sideOf = (ride: Ride, userId: number): Side => (userId === ride.driverId ? 'driver' : 'passenger');

async function party(deps: ComplaintsDeps, userId: number, side: Side) {
  const [person, trips, complaints] = await Promise.all([
    deps.people.find(userId),
    deps.trips(userId, side),
    deps.store.countAgainst(userId),
  ]);
  const firstName = person?.firstName ?? '';
  const id = person?.publicId ?? '';
  return { id, firstName, hasAvatar: Boolean(person?.avatarKey), role: side, trips, complaints };
}

async function view(deps: ComplaintsDeps, complaint: ComplaintRecord): Promise<Complaint | null> {
  const ride = await deps.filedRide(complaint.bookingId);
  if (!ride) return null;
  const { id, reason, comment, status, createdAt, authorId, againstId } = complaint;
  const [author, against] = await Promise.all([
    party(deps, authorId, sideOf(ride, authorId)),
    party(deps, againstId, sideOf(ride, againstId)),
  ]);
  const base = { id, reason, high: isHigh(reason), comment, status, createdAt };
  return { ...base, tripId: ride.tripId, departAt: ride.departAt, author, against };
}

// The queue of the team (docs/17): open complaints, high priority first.
export async function complaintQueue(deps: ComplaintsDeps): Promise<Complaint[]> {
  const views = await Promise.all(
    (await deps.store.open()).sort(queueOrder).map((known) => view(deps, known)),
  );
  return views.filter((known) => known !== null);
}

// Opening a new complaint takes it into review.
export async function openComplaint(deps: ComplaintsDeps, id: string) {
  const complaint = await deps.store.find(id);
  if (!complaint) return undefined;
  const taken = complaint.status === 'new' ? { ...complaint, status: 'in_review' as const } : complaint;
  if (taken !== complaint) await deps.store.save(taken);
  return (await view(deps, taken)) ?? undefined;
}

// The chat of the ride, only through its complaint, and every read goes to the log (docs/07).
export async function complaintChat(deps: ComplaintsDeps, moderatorId: number, id: string) {
  const complaint = await deps.store.find(id);
  const ride = complaint ? await deps.filedRide(complaint.bookingId) : undefined;
  if (!complaint || !ride) return undefined;
  await deps.store.logChatRead(id, moderatorId, deps.now());
  // The team sees who wrote by the public id, as in the complaint (docs/65 A3).
  const [driver, passenger] = await Promise.all([
    deps.people.find(ride.driverId),
    deps.people.find(ride.passengerId),
  ]);
  const publicIds = new Map([
    [ride.driverId, driver?.publicId ?? ''],
    [ride.passengerId, passenger?.publicId ?? ''],
  ]);
  const lines = await deps.chat(ride.chatKey);
  return lines.map((line) => ({
    ...line,
    author: line.author === null ? null : (publicIds.get(line.author) ?? null),
  }));
}

// The decision (docs/17): nothing, a warning, or a block by Telegram ID and phone with the
// person's live trips and bookings cancelled. A no-show may give the driver the commission back.
export async function decide(deps: ComplaintsDeps, moderator: Moderator, id: string, decision: Decision) {
  const moderatorId = moderator.id;
  const complaint = await deps.store.find(id);
  const ride = complaint ? await deps.filedRide(complaint.bookingId) : undefined;
  if (!complaint || !ride) return 'complaints.not_found' as const;
  if (complaint.status === 'resolved') return 'complaints.wrong_status' as const;
  const against = complaint.againstId;
  const side = sideOf(ride, against);
  if (decision.action === 'block' && !moderator.owner && (await deps.isTeam(against)))
    return 'auth.not_owner' as const;
  const now = deps.now();
  const days = decision.action === 'block' ? (decision.days ?? null) : null;
  const label = decision.action === 'block' ? `block:${days ?? 'forever'}` : decision.action;
  const refund =
    decision.refund && complaint.reason === 'no_show' && side === 'passenger' && ride.commission > 0;
  const decided = { decision: refund ? `${label}:refund` : label, decidedBy: moderatorId, decidedAt: now };
  // The decision is written first, in one step: a second tap changes nothing (docs/65 A4).
  if (!(await deps.store.resolve({ ...complaint, status: 'resolved', ...decided })))
    return 'complaints.wrong_status' as const;
  if (decision.action === 'warning') await deps.tell.warning(against, side);
  if (decision.action === 'block') {
    const reason = `complaint:${complaint.id}`;
    await blockPerson(deps, {
      userId: against,
      days,
      by: moderatorId,
      byOwner: moderator.owner,
      reason,
      side,
    });
  }
  // A deleted account kept its phone for this complaint only (docs/58).
  await deps.people.releasePhone(against);
  if (refund) await deps.refund(moderatorId, ride.driverId, ride.commission, `no_show:${complaint.id}`);
  await deps.tell.resolved(complaint.authorId, sideOf(ride, complaint.authorId));
  return 'ok' as const;
}
