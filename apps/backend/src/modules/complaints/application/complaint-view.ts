import type { Complaint } from '@platform/contracts';
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
