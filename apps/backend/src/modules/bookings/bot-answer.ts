import type { Bindings } from '../../env';
import { sendSignals } from '../feed';
import { answer, confirm, mine } from './application/answer';
import { bookingsDeps } from './deps';
import { driverNewsOf } from './driver-news-of';
import { tellNoMoney } from './no-money';

// «Qabul qilish» and «Rad etish» of a request card, right in the driver bot (G68, docs/122): the
// same rules and money as in the app. A refused answer shows the request as it is now.
export async function answerFromBot(env: Bindings, driverId: number, bookingId: string, yes: boolean) {
  const deps = bookingsDeps(env);
  const result = yes
    ? await confirm(deps, driverId, bookingId)
    : await answer(deps, driverId, bookingId, 'decline');
  // The open app of the driver shows the answer given in the bot (docs/64).
  if (result.ok) return sendSignals(env, [{ userId: driverId, app: 'driver' }]).then(() => 'ok' as const);
  const found = await mine(deps, driverId, bookingId);
  if (found) await driverNewsOf(env, deps)(found.record.tripId, bookingId);
  if (found && result.error === 'wallet.not_enough')
    await tellNoMoney(env, driverId, found.record.commission);
  return result.error;
}
