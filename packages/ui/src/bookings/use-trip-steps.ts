import { tashkentDate, tashkentDayStart, type Booking } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { inCar } from './in-car';
import { useShareTrip } from './use-share-trip';

// «Yetib keldim» once the passenger is in the car (in-car.ts, G76, docs/43); only from the day of the
// trip on, by Toshkent (docs/89 P7).
function passengerStep(booking: Booking, now: number, meetMinutes: number): 'arrived' | null {
  const onTheDay =
    booking.status === 'confirmed' && now >= tashkentDayStart(tashkentDate(booking.trip.departAt));
  return onTheDay && inCar(booking, now, meetMinutes) && booking.arrivedAt === null ? 'arrived' : null;
}

// The booking of the screen wins: it follows the live signal (docs/65 B2). Only what the person
// has just told («Men keldim», «Yetib keldim») shows before the screen has it.
export function withTold(booking: Booking, told: Booking | null): Booking {
  if (told?.id !== booking.id) return booking;
  return {
    ...booking,
    boardedAt: booking.boardedAt ?? told.boardedAt,
    arrivedAt: booking.arrivedAt ?? told.arrivedAt,
    cameAt: booking.cameAt ?? told.cameAt,
  };
}

// The steps of a passenger on the way (docs/43, docs/118 path 3): the card for the close people,
// then «Yetib keldim» on the day of the trip once the driver marked the passenger in the car.
export function useTripSteps(booking: Booking, onTold: (booking: Booking) => void) {
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const { meetMinutes } = useBrand().schedule;
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
  const step = () =>
    run(async () => {
      onTold(await chat.arrived(booking.id));
      track({ name: 'arrived', screen: 'bookings.passenger' });
    }, 'told');
  const next = passengerStep(booking, Date.now(), meetMinutes);
  return {
    failure,
    note,
    next,
    step: () => (next ? void step() : undefined),
    share: () => void run(() => shareTrip(booking.id), 'told'),
    stop: () => void run(() => chat.stopSharing(booking.id), 'stopped'),
  };
}
