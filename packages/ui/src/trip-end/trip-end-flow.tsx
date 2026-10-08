import type { Booking, Trip } from '@platform/contracts';
import { useState } from 'react';
import type { TripDraft } from '../market/trip-draft';
import { ReturnOffer } from './return-offer';
import { TripDoneScreen } from './trip-done-screen';

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onPublish: (draft: Partial<TripDraft>) => void;
  readonly onClose: () => void;
};

// Once after «Yetib keldik» (docs/124 В): «Safar tugadi» with the stars, then «Qaytish». «Назад»
// on either screen closes the flow.
export function TripEndFlow({ trip, bookings, onPublish, onClose }: Props) {
  const [back, setBack] = useState(false);
  return back ? (
    <ReturnOffer trip={trip} onPublish={onPublish} onClose={onClose} />
  ) : (
    <TripDoneScreen trip={trip} bookings={bookings} onDone={() => setBack(true)} onBack={onClose} />
  );
}
