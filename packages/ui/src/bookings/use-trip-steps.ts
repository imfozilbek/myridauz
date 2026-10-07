import { tashkentDate, tashkentDayStart, type Booking } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { useShareTrip } from './use-share-trip';

// «Mashinaga chiqdim» the day before the trip is a mistake (docs/89 P7): from its day on, by Toshkent.
const tripDayCame = (departAt: number) => Date.now() >= tashkentDayStart(tashkentDate(departAt));

// The booking of the screen wins: it follows the live signal (docs/65 B2). Only what the person
// has just told («Mashinaga chiqdim», «Yetib keldim») shows before the screen has it.
export function withTold(booking: Booking, told: Booking | null): Booking {
  if (told?.id !== booking.id) return booking;
  return {
    ...booking,
    boardedAt: booking.boardedAt ?? told.boardedAt,
    arrivedAt: booking.arrivedAt ?? told.arrivedAt,
  };
}

// The steps of a passenger on the way (docs/43, docs/118 path 3): the card for the close people,
// then one main step at a time, «Mashinaga chiqdim» and «Yetib keldim», only on the day of the trip.
export function useTripSteps(booking: Booking, onTold: (booking: Booking) => void) {
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const shareTrip = useShareTrip();
  const { failure, fail, clear } = useFailure();
  // What the close people were just told: the note and «Ulashishni toʻxtatish» under the buttons.
  const [note, setNote] = useState<'told' | 'stopped' | null>(null);
  const run = async (action: () => Promise<void>, after: 'told' | 'stopped') => {
    clear();
    try {
      await action();
      haptic.success();
      setNote(after);
    } catch (caught) {
      fail(caught);
    }
  };
  const step = (name: 'boarded' | 'arrived') =>
    run(async () => {
      onTold(await chat[name](booking.id));
      track({ name, screen: 'bookings.passenger' });
    }, 'told');
  const onTheDay = booking.status === 'confirmed' && tripDayCame(booking.trip.departAt);
  const next = !onTheDay
    ? null
    : booking.boardedAt === null
      ? ('boarded' as const)
      : booking.arrivedAt === null
        ? ('arrived' as const)
        : null;
  return {
    failure,
    note,
    next,
    step: () => (next ? void step(next) : undefined),
    share: () => void run(() => shareTrip(booking.id), 'told'),
    stop: () => void run(() => chat.stopSharing(booking.id), 'stopped'),
  };
}
