import { useEffect, useState } from 'react';
import { cancellable } from '../bookings/booking-status';
import { useApiClients } from '../context/api-clients';

// Whether the passenger already asked a seat on this trip: one trip takes one seat request of a
// person, so the screen says it instead of a «Joy band qilish» the server refuses (G52, docs/112).
// While loading or on a failure the button stays: the server checks again.
export function useAskedSeat(tripId: string, wanted: boolean): boolean {
  const { bookings } = useApiClients();
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    if (!wanted) return undefined;
    let live = true;
    bookings.myBookings().then(
      (mine) => live && setAsked(mine.some((item) => item.trip.id === tripId && cancellable(item.status))),
      () => undefined,
    );
    return () => void (live = false);
  }, [bookings, tripId, wanted]);
  return asked;
}
