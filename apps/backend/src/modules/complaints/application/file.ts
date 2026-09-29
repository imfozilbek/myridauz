import { complaintInputSchema, COMPLAINT_WINDOW_DAYS, DAY_MS } from '@platform/contracts';
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
  if (isHigh(complaint.reason))
    await deps.tell.team(complaint, (await deps.people.find(againstId))?.firstName ?? '');
  return { id: complaint.id };
}

// People out of the search: complaints from 3 different people in 30 days (docs/17).
export async function hiddenFromSearch(deps: ComplaintsDeps, userIds: readonly number[]) {
  if (userIds.length === 0) return new Set<number>();
  const now = deps.now();
  return hiddenPeople(await deps.store.against(userIds, now - COMPLAINT_WINDOW_DAYS * DAY_MS), now);
}
