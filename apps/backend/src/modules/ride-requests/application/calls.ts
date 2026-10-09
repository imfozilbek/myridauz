import type { RideRequest } from '@platform/contracts';
import { isOpen } from '../domain/ride-request';
import type { RequestsDeps, Result } from './ports';
import { views } from './views';

// The passenger turns the calls of drivers about an open request off and on (G64, docs/127): drivers
// still write in the chat.
export async function setRequestCalls(
  deps: RequestsDeps,
  passengerId: number,
  id: string,
  on: boolean,
): Promise<Result<RideRequest, 'trips.not_found' | 'trips.wrong_status'>> {
  const request = await deps.requests.find(id);
  if (request?.passengerId !== passengerId) return { ok: false, error: 'trips.not_found' };
  if (!isOpen(request, deps.now())) return { ok: false, error: 'trips.wrong_status' };
  const next = { ...request, callsOff: !on };
  await deps.requests.save(next);
  const [view] = await views(deps, [next]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}
