import type { RequestBoard } from '@platform/contracts';
import type { RequestsDeps } from './ports';

// The driver saw these requests on «Yoʻlovchilar soʻrovlari»: each counts once for «N haydovchi
// koʻrdi» of the passenger (G76, mockup g76/2 state 4). Written after the answer (afterResponse).
export async function boardSeen(deps: RequestsDeps, driverId: number, board: RequestBoard): Promise<void> {
  const ids = [...board.fits, ...board.others].map((request) => request.id);
  await deps.seen.record(ids, driverId, deps.now());
}
