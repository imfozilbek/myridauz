import type { Bindings } from '../../env';
import { answer, confirm, mine } from './application/answer';
import { bookingsDeps } from './deps';
import { driverNewsOf } from './driver-news-of';

// «Qabul qilish» and «Rad etish» of a request card, right in the driver bot (G68, docs/122): the
// same rules and money as in the app. A refused answer shows the request as it is now.
export async function answerFromBot(env: Bindings, driverId: number, bookingId: string, yes: boolean) {
  const deps = bookingsDeps(env);
  const result = yes
    ? await confirm(deps, driverId, bookingId)
    : await answer(deps, driverId, bookingId, 'decline');
  if (result.ok) return 'ok';
  const found = await mine(deps, driverId, bookingId);
  if (found) await driverNewsOf(env, deps)(found.record.tripId, bookingId);
  return result.error;
}
