import {
  COMPLAINT_DECISIONS,
  PAST_COMPLAINTS,
  type Complaint,
  type ComplaintCase,
} from '@platform/contracts';
import { isHigh, type ComplaintRecord } from '../domain/complaint';
import type { ComplaintsDeps, Ride, Side } from './ports';

export const sideOf = (ride: Ride, userId: number): Side =>
  userId === ride.driverId ? 'driver' : 'passenger';

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

// A complaint as the team sees it (docs/17): both sides with their history, the refund of a
// no-show with the commission of the ride (docs/35, G63).
export async function complaintView(
  deps: ComplaintsDeps,
  complaint: ComplaintRecord,
): Promise<Complaint | null> {
  const ride = await deps.filedRide(complaint.bookingId);
  if (!ride) return null;
  const { id, reasons, comment, status, createdAt, authorId, againstId } = complaint;
  const [author, against] = await Promise.all([
    party(deps, authorId, sideOf(ride, authorId)),
    party(deps, againstId, sideOf(ride, againstId)),
  ]);
  const base = { id, reasons: [...reasons], high: isHigh(reasons), comment, status, createdAt };
  const refund = complaint.refund && { state: complaint.refund.state, amount: ride.commission };
  return { ...base, tripId: ride.tripId, departAt: ride.departAt, author, against, refund };
}

// «block:7:refund» → «block»: the kind of the decision, the days and the refund are elsewhere.
const decisionOf = (label: string | null) =>
  COMPLAINT_DECISIONS.find((decision) => label?.split(':')[0] === decision) ?? null;

// The open case (docs/17, G45): the complaint and the newest complaints before it against the same
// person.
export async function caseView(
  deps: ComplaintsDeps,
  complaint: ComplaintRecord,
): Promise<ComplaintCase | null> {
  const [shown, all] = await Promise.all([
    complaintView(deps, complaint),
    deps.store.against([complaint.againstId], 0),
  ]);
  if (!shown) return null;
  const past = all
    .filter((other) => other.id !== complaint.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, PAST_COMPLAINTS)
    .map(({ id, reasons, decision, createdAt }) => ({
      id,
      reasons: [...reasons],
      decision: decisionOf(decision),
      at: createdAt,
    }));
  return { ...shown, past };
}
