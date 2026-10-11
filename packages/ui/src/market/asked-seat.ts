import type { Booking } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { cancellable } from '../bookings/booking-status';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useFreshLists } from '../home/fresh-lists';
import { useSharedPassengerData } from '../home/passenger-data';

// Why «Joy band qilish» would be refused (G52, docs/112): a seat of this trip is asked already, or
// the requests waiting for an answer reached the limit of the brand (G75, docs/158 А). The screen
// says it instead of a button the server refuses. While loading or on a failure the button stays:
// the server checks again.
export type SeatBlock = 'asked' | 'limit' | null;

export function useAskedSeat(tripId: string, wanted: boolean): SeatBlock {
  const { bookings } = useApiClients();
  const { maxPending } = useBrand().bookings;
  // The seats of the main screen when «Safar» opens inside it: one list, not a second one (G77).
  const shared = useSharedPassengerData();
  const [loaded, setLoaded] = useState<readonly Booking[] | null>(null);
  const alone = shared === null;
  useEffect(() => {
    if (!wanted || !alone) return undefined;
    let live = true;
    bookings.myBookings().then(
      (mine) => void (live && setLoaded(mine)),
      () => undefined,
    );
    return () => void (live = false);
  }, [bookings, wanted, alone]);
  // Refreshed as «Safar» opens: a seat asked a moment ago counts too (G77).
  useFreshLists(shared, wanted);
  const mine = shared ? (shared.value?.[0] ?? null) : loaded;
  if (!wanted || !mine) return null;
  if (mine.some((item) => item.trip.id === tripId && cancellable(item.status))) return 'asked';
  return mine.filter((item) => item.status === 'requested').length >= maxPending ? 'limit' : null;
}
