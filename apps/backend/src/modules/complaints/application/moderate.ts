import type { Complaint, complaintDecisionSchema } from '@platform/contracts';
import type { z } from 'zod';
import { queueOrder } from '../domain/complaint';
import { blockPerson } from './block';
import { complaintView as view, sideOf } from './complaint-view';
import type { ComplaintsDeps, Ride } from './ports';

// Who decides: a moderator, or the owner who may also block a member of the team.
export type Moderator = { readonly id: number; readonly owner: boolean };

type Decision = z.output<typeof complaintDecisionSchema>;

// The queue of the team (docs/17): open complaints, high priority first, and the decided ones
// whose refund waits for the owner (docs/35, G63).
export async function complaintQueue(deps: ComplaintsDeps): Promise<Complaint[]> {
  const [open, waiting] = await Promise.all([deps.store.open(), deps.store.refundsProposed()]);
  const views = await Promise.all([...open, ...waiting].sort(queueOrder).map((known) => view(deps, known)));
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
// person's live trips and bookings cancelled. On a no-show the moderator may propose to give the
// driver the commission back: no money moves until the owner confirms (docs/35, G63).
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
  const proposal = { state: 'proposed', proposedBy: moderatorId, proposedAt: now } as const;
  const decided = {
    decision: refund ? `${label}:refund` : label,
    decidedBy: moderatorId,
    decidedAt: now,
    refund: refund ? { ...proposal, decidedBy: null, decidedAt: null } : null,
  };
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
  await forgetEvidence(deps, ride);
  await deps.tell.resolved(complaint.authorId, sideOf(ride, complaint.authorId));
  return 'ok' as const;
}

// The chat of a ride stays as evidence when a side deletes the account (docs/65 A5); the last
// decision on the ride ends it (G44, docs/58).
async function forgetEvidence(deps: ComplaintsDeps, ride: Ride) {
  const sides = await Promise.all([ride.driverId, ride.passengerId].map((id) => deps.people.find(id)));
  if (!sides.includes(undefined)) return;
  const open = await deps.store.open();
  if (!open.some((complaint) => complaint.bookingId === ride.bookingId)) await deps.forgetChat(ride.chatKey);
}
