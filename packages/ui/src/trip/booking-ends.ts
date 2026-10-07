import type { Booking, BookedPlace } from '@platform/contracts';
import { usePlaces } from '../market/places-gate';
import { useNameText } from '../way/way-end';

// The names of the two points of a booking (docs/121): the pitak or the place the passenger chose,
// else the district of the trip; and the region of a district for the line under it.
export function useBookingEnds(booking: Booking) {
  const directory = usePlaces();
  const nameText = useNameText();
  const { trip } = booking;
  const regionName = (id: string) => {
    const place = directory.find(id);
    return (place?.parentId ? directory.find(place.parentId) : place)?.name ?? '';
  };
  const placeName = (booked: BookedPlace | null, id: string) =>
    booked
      ? nameText(booked.name ?? booked.area, directory.find(id) ?? id)
      : (directory.find(id)?.name ?? id);
  return {
    start: booking.pitak ? booking.pitak.name : placeName(booking.pickup, trip.from),
    end: placeName(booking.dropoff, trip.to),
    // The exact points open in a map; before the confirmation and 30 days after there are none.
    startPoint: booking.pitak?.point ?? booking.pickup?.point ?? null,
    endPoint: booking.dropoff?.point ?? null,
    regionName,
  };
}
