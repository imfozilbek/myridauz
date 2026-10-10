import { useEffect, useState } from 'react';
import { cancellable } from '../bookings/booking-status';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';

// Why «Joy band qilish» would be refused (G52, docs/112): a seat of this trip is asked already, or
// the requests waiting for an answer reached the limit of the brand (G75, docs/158 А). The screen
// says it instead of a button the server refuses. While loading or on a failure the button stays:
// the server checks again.
export type SeatBlock = 'asked' | 'limit' | null;

export function useAskedSeat(tripId: string, wanted: boolean): SeatBlock {
  const { bookings } = useApiClients();
  const { maxPending } = useBrand().bookings;
  const [block, setBlock] = useState<SeatBlock>(null);
  useEffect(() => {
    if (!wanted) return undefined;
    let live = true;
    bookings.myBookings().then(
      (mine) => {
        if (!live) return;
        if (mine.some((item) => item.trip.id === tripId && cancellable(item.status)))
          return setBlock('asked');
        const waiting = mine.filter((item) => item.status === 'requested').length;
        setBlock(waiting >= maxPending ? 'limit' : null);
      },
      () => undefined,
    );
    return () => void (live = false);
  }, [bookings, tripId, wanted, maxPending]);
  return block;
}
