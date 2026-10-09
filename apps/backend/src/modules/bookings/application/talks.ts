import { chatKeyOfTalk } from '@platform/contracts';
import type { TalkRecord } from '../domain/talk';
import { watchPair } from './pair-talks';
import type { BookingsDeps, Result } from './ports';

type TalkError = 'trips.not_driver' | 'bookings.not_found' | 'bookings.own_trip';

type Asked = { readonly id: string; readonly passengerId: number };

// The talk of a request and a driver, made at the first need: a message, a call or an offer (G64).
// A new talk may be the third of a pair without a booking (docs/129); that watch never stops it.
export async function talkOf(deps: BookingsDeps, request: Asked, driverId: number): Promise<TalkRecord> {
  const id = deps.newId();
  const talk = await deps.talks.open({ id, requestId: request.id, driverId, createdAt: deps.now() });
  if (talk.id === id)
    await watchPair(deps, driverId, request.passengerId).catch((error: unknown) =>
      console.warn(JSON.stringify({ event: 'pair_watch_failed', message: String(error) })),
    );
  return talk;
}

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
  const talk = await talkOf(deps, request, driverId);
  return { ok: true, value: { chatKey: chatKeyOfTalk(talk.id) } };
}
