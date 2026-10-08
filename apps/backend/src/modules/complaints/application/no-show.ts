import type { RefundState } from '@platform/contracts';
import type { ComplaintRecord } from '../domain/complaint';
import { fileComplaint } from './file';
import type { ComplaintsDeps } from './ports';

// «Kelmadi» of the driver at the point (docs/124 В, G63): one no_show complaint about the
// passenger, by the rules of every complaint; a complaint about this ride already there stays alone.
export async function fileNoShow(deps: ComplaintsDeps, driverId: number, bookingId: string) {
  await fileComplaint(deps, driverId, { bookingId, reason: 'no_show', comment: '' });
}

// The refunds of no-shows on these rides of the driver, by booking: the driver sees each (docs/129).
// A case the team decided without a refund reads as rejected: nothing more to wait for.
export async function noShowRefunds(deps: ComplaintsDeps, driverId: number, bookingIds: readonly string[]) {
  const filed = await deps.store.ofAuthorRides(driverId, bookingIds);
  return new Map<string, RefundState>(
    filed.flatMap((complaint) => {
      const state = refundState(complaint);
      return state ? [[complaint.bookingId, state]] : [];
    }),
  );
}

const refundState = (complaint: ComplaintRecord): RefundState | null =>
  complaint.refund?.state ?? (complaint.status === 'resolved' ? 'rejected' : null);
