import type { RefundAnswer } from '@platform/contracts';
import type { Moderator } from './moderate';
import type { ComplaintsDeps } from './ports';

// The owner answers the refund a moderator proposed on a no-show (docs/35, owner decision
// 06.10.2026): confirmed, the commission of the booking goes back to the driver once.
// The answer is written first, in one step: a second tap or a second owner changes nothing.
export async function answerRefund(deps: ComplaintsDeps, owner: Moderator, id: string, answer: RefundAnswer) {
  if (!owner.owner) return 'auth.not_owner' as const;
  const complaint = await deps.store.find(id);
  const ride = complaint ? await deps.filedRide(complaint.bookingId) : undefined;
  if (!complaint || !ride) return 'complaints.not_found' as const;
  if (complaint.refund?.state !== 'proposed') return 'complaints.wrong_status' as const;
  const state = answer === 'confirm' ? ('confirmed' as const) : ('rejected' as const);
  const refund = { ...complaint.refund, state, decidedBy: owner.id, decidedAt: deps.now() };
  if (!(await deps.store.answerRefund({ ...complaint, refund }))) return 'complaints.wrong_status' as const;
  if (state === 'confirmed') await deps.refund(owner.id, ride.driverId, ride.bookingId);
  return 'ok' as const;
}
