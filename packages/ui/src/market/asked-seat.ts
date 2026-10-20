import { seatHolds, tripHolds, type Booking, type RideRequest } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { cancellable } from '../bookings/booking-status';
import { useApiClients } from '../context/api-clients';
import { useFreshLists } from '../home/fresh-lists';
import { useSharedPassengerData } from '../home/passenger-data';

// What «Joy band qilish» meets (G52, docs/112; one at a time, owner decision 12.10.2026, docs/172):
// a seat of this trip is asked already; a seat held on another trip; the button opens either (G90
// PAS-9); waiting: the seat waits for its driver, a cancel ends it (PAS-10). An open request, which
// the seat closes, is said above the button. While loading or on a failure the button stays: the
// server checks again.
export type SeatBlock =
  | { readonly kind: 'asked'; readonly bookingId: string }
  | { readonly kind: 'held'; readonly bookingId: string; readonly waiting: boolean }
  | { readonly kind: 'request' }
  | null;

type Lists = readonly [readonly Booking[], readonly RideRequest[]];

export function useAskedSeat(tripId: string, wanted: boolean): SeatBlock {
  const { bookings, market } = useApiClients();
  // The lists of the main screen when «Safar» opens inside it: one list, not a second one (G77).
  const shared = useSharedPassengerData();
  const [loaded, setLoaded] = useState<Lists | null>(null);
  const alone = shared === null;
  useEffect(() => {
    if (!wanted || !alone) return undefined;
    let live = true;
    Promise.all([bookings.myBookings(), market.myRequests()]).then(
      (lists) => void (live && setLoaded(lists)),
      () => undefined,
    );
    return () => void (live = false);
  }, [bookings, market, wanted, alone]);
  // Refreshed as «Safar» opens: a seat asked a moment ago counts too (G77).
  useFreshLists(shared, wanted);
  const lists = shared ? (shared.value ?? null) : loaded;
  if (!wanted || !lists) return null;
  return seatBlockOf(tripId, lists[0], lists[1], Date.now());
}

function seatBlockOf(
  tripId: string,
  mine: readonly Booking[],
  requests: readonly RideRequest[],
  now: number,
): SeatBlock {
  const asked = mine.find((item) => item.trip.id === tripId && cancellable(item.status));
  if (asked) return { kind: 'asked', bookingId: asked.id };
  const held = mine.find((item) => seatHolds(item, tripHolds(item.trip, now), now));
  if (held) return { kind: 'held', bookingId: held.id, waiting: held.status === 'requested' };
  return requests.some((request) => request.status === 'open') ? { kind: 'request' } : null;
}
