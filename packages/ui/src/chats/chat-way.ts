import type { ChatAbout } from '@platform/contracts';
import { noonOf } from '../market/when';

// When and where the trip of a chat goes: the booking, the offer, or the day of the request.
export const wayOf = ({ booking, offer, request }: ChatAbout) =>
  booking
    ? { at: booking.trip.departAt, from: booking.trip.from, to: booking.trip.to }
    : offer
      ? { at: offer.departAt, from: offer.from, to: offer.to }
      : request
        ? { at: noonOf(request.date).getTime(), from: request.from, to: request.to, day: true }
        : null;
