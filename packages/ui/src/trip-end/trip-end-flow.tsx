import type { Booking, Trip } from '@platform/contracts';
import { useState } from 'react';
import { ReturnOffer } from './return-offer';
import type { ReturnTrip } from './return-plan';
import { TripDoneScreen } from './trip-done-screen';

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onPublish: (back: ReturnTrip) => void;
  readonly onClose: () => void;
  // The stars went to the server: the list brings the bookings marked rated (docs/24), so the past
  // trip shows them and does not offer them again, whatever screen comes after «Qaytish».
  readonly onRated: () => void;
};

// Once after «Yetib keldik» (docs/124 В): «Safar tugadi» with the stars, then «Qaytish». «Назад»
// on either screen closes the flow.
export function TripEndFlow({ trip, bookings, onPublish, onClose, onRated }: Props) {
  const [back, setBack] = useState(false);
  const rated = () => {
    onRated();
    setBack(true);
  };
  return back ? (
    <ReturnOffer trip={trip} onPublish={onPublish} onClose={onClose} />
  ) : (
    <TripDoneScreen trip={trip} bookings={bookings} onDone={rated} onBack={onClose} />
  );
}
