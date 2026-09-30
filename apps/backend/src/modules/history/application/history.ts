import { HISTORY_LIMIT, type HistoryItem } from '@platform/contracts';

export type Side = 'passenger' | 'driver';

// A ride that is over, from the bookings module.
type PastRide = {
  readonly bookingId: string;
  readonly tripId: string;
  readonly driverId: number;
  readonly passengerId: number;
  readonly seats: number;
  readonly price: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  readonly km: number;
};

export type HistoryDeps = {
  readonly rides: (userId: number, side: Side) => Promise<PastRide[]>;
  // Per booking: the stars the person gave and the published stars the person got (docs/24).
  readonly stars: (userId: number) => Promise<{
    readonly given: ReadonlyMap<string, number>;
    readonly received: ReadonlyMap<string, number>;
  }>;
  readonly names: (ids: readonly number[]) => Promise<ReadonlyMap<number, string>>;
};

const TENTHS = 10;
const average = (stars: readonly number[]) =>
  stars.length === 0 ? null : Math.round((stars.reduce((a, b) => a + b, 0) / stars.length) * TENTHS) / TENTHS;

// "Safarlar tarixi" (G18, docs/18): a passenger sees each ride with the driver; a driver sees each
// trip with its passengers, the average of the published stars got on it.
export async function historyOf(deps: HistoryDeps, userId: number, side: Side): Promise<HistoryItem[]> {
  const rides = await deps.rides(userId, side);
  const others = rides.map((ride) => (side === 'passenger' ? ride.driverId : ride.passengerId));
  const [stars, names] = await Promise.all([deps.stars(userId), deps.names([...new Set(others)])]);
  const nameOf = (id: number) => names.get(id) ?? '';
  if (side === 'passenger') {
    return rides.slice(0, HISTORY_LIMIT).map((ride) => ({
      ...facts(ride),
      id: ride.bookingId,
      price: ride.price,
      seats: ride.seats,
      people: [nameOf(ride.driverId)],
      given: stars.given.get(ride.bookingId) ?? null,
      received: stars.received.get(ride.bookingId) ?? null,
    }));
  }
  const trips = new Map<string, PastRide[]>();
  for (const ride of rides) trips.set(ride.tripId, [...(trips.get(ride.tripId) ?? []), ride]);
  return [...trips.values()].slice(0, HISTORY_LIMIT).map((group) => {
    const [first] = group as [PastRide, ...PastRide[]];
    const received = group.flatMap((ride) => stars.received.get(ride.bookingId) ?? []);
    return {
      ...facts(first),
      id: first.tripId,
      price: first.price,
      seats: group.reduce((sum, ride) => sum + ride.seats, 0),
      people: group.map((ride) => nameOf(ride.passengerId)),
      given: null,
      received: average(received),
    };
  });
}

const facts = ({ from, to, departAt, km }: PastRide) => ({ from, to, departAt, km });
