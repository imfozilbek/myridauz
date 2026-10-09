import { chatKeyOfTalk } from '@platform/contracts';
import type { TalkRecord } from '../domain/talk';
import type { BookingsDeps, Result } from './ports';

type TalkError = 'trips.not_driver' | 'bookings.not_found' | 'bookings.own_trip';

// The talk of a request and a driver, made at the first need: a message, a call or an offer (G64).
export const talkOf = (deps: BookingsDeps, requestId: string, driverId: number): Promise<TalkRecord> =>
  deps.talks.open({ id: deps.newId(), requestId, driverId, createdAt: deps.now() });

// A driver writes or calls a passenger about an open request before any offer (G64, docs/118 path 7):
// only an approved driver, never on an own request; the numbers stay hidden (docs/07).
export async function openTalk(
  deps: BookingsDeps,
  driverId: number,
  requestId: string,
): Promise<Result<{ readonly chatKey: string }, TalkError>> {
  const [car, request] = await Promise.all([deps.approvedCar(driverId), deps.requests.find(requestId)]);
  if (!car) return { ok: false, error: 'trips.not_driver' };
  if (!request?.open) return { ok: false, error: 'bookings.not_found' };
  if (request.passengerId === driverId) return { ok: false, error: 'bookings.own_trip' };
  const talk = await talkOf(deps, requestId, driverId);
  return { ok: true, value: { chatKey: chatKeyOfTalk(talk.id) } };
}
