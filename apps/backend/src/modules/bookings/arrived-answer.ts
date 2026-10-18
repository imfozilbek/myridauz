import type { Bindings } from '../../env';
import { sendSignals } from '../feed';
import { closeBookingShare } from '../shares';
import { markProgress } from './application/progress';
import { bookingsDeps } from './deps';

export { ARRIVED_PREFIX } from './infrastructure/arrived-buttons';

// The answer to «Yetib keldingizmi?» in the passenger bot (G46, docs/43): «Ha, yetib keldim» is
// «Yetib keldim» of the app and closes the link of close people; «Hali yoʻldaman» changes nothing.
// Only the passenger of the seat answers; a trip closed by its time meanwhile still takes «Ha».
export async function answerArrived(env: Bindings, passengerId: number, bookingId: string, yes: boolean) {
  const deps = bookingsDeps(env);
  const record = await deps.bookings.find(bookingId);
  if (record?.passengerId !== passengerId) return 'bookings.not_found';
  if (!yes) return 'ok';
  const result = await markProgress(deps, passengerId, bookingId, 'arrived');
  if (!result.ok && record.status !== 'completed') return result.error;
  await closeBookingShare(env, bookingId);
  // The open app of the passenger shows the arrival given in the bot (docs/64).
  await sendSignals(env, [{ userId: passengerId, app: 'passenger' }]);
  return 'ok';
}
