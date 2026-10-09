import type { Standing } from '@platform/contracts';
import type { HistoryDeps, Side } from './history';

// The three numbers on top of «Profil» (G65, mockup g65/3): the rating, the trips that are over and
// «vaqtida». A driver counts a trip once, however many passengers rode in it.
export async function standingOf(deps: HistoryDeps, userId: number, side: Side): Promise<Standing> {
  const [rides, reviews] = await Promise.all([deps.rides(userId, side), deps.standing(userId)]);
  const trips = side === 'passenger' ? rides.length : new Set(rides.map((ride) => ride.tripId)).size;
  return { ...reviews, trips };
}
