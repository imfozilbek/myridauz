import { COMPLAIN_DAYS, complaintInputSchema, COMPLAINT_WINDOW_DAYS, DAY_MS } from '@platform/contracts';
import type { z } from 'zod';
import { hiddenPeople, isHigh } from '../domain/complaint';
import type { ComplaintsDeps } from './ports';

type Input = z.output<typeof complaintInputSchema>;

// A complaint about the other side of one's own ride, once per ride (docs/17). High priority
// goes to the team at once; the one complained about never learns who wrote it.
export async function fileComplaint(deps: ComplaintsDeps, authorId: number, input: Input) {
  const ride = await deps.ride(input.bookingId);
  if (!ride || (authorId !== ride.driverId && authorId !== ride.passengerId))
    return 'complaints.not_found' as const;
  if (await deps.store.ofAuthor(authorId, input.bookingId)) return 'complaints.already' as const;
  // A week after the trip a complaint goes through «Yordam» (docs/129).
  if (ride.endsAt + COMPLAIN_DAYS * DAY_MS <= deps.now()) return 'complaints.too_late' as const;
  const againstId = authorId === ride.driverId ? ride.passengerId : ride.driverId;
  const complaint = {
    id: deps.newId(),
    authorId,
    againstId,
    bookingId: input.bookingId,
    reason: input.reason,
    comment: input.comment,
    status: 'new' as const,
    decision: null,
    decidedBy: null,
    createdAt: deps.now(),
    decidedAt: null,
  };
  await deps.store.save(complaint);
  if (!isHigh(complaint.reason)) return { id: complaint.id };
  const against = await deps.people.find(againstId);
  await deps.tell.team(complaint, { firstName: against?.firstName ?? '', publicId: against?.publicId ?? '' });
  return { id: complaint.id };
}

// People out of the search: complaints from 3 different people in 30 days (docs/17). Only the
// complaints the team can open count: one whose ride is gone never leaves the queue (docs/90 F-A1).
export async function hiddenFromSearch(deps: ComplaintsDeps, userIds: readonly number[]) {
  if (userIds.length === 0) return new Set<number>();
  const now = deps.now();
  const since = now - COMPLAINT_WINDOW_DAYS * DAY_MS;
  // A decided complaint hides nobody: only the open ones need their ride.
  const recent = (await deps.store.against(userIds, since)).filter((known) => known.status !== 'resolved');
  const rides = await Promise.all(recent.map((complaint) => deps.filedRide(complaint.bookingId)));
  return hiddenPeople(
    recent.filter((_, index) => rides[index] !== undefined),
    now,
  );
}
