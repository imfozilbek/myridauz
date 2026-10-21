import type { ChatAbout } from '@platform/contracts';
import { noonOf } from '../market/when';

// When and where the trip of a chat goes: the booking, the offer, or the day of the request. until:
// the end of a range (G90, docs/216).
export const wayOf = ({ booking, offer, request }: ChatAbout) => {
  const timed = booking?.trip ?? offer;
  if (timed) return { at: timed.departAt, until: timed.departUntil, from: timed.from, to: timed.to };
  if (!request) return null;
  return { at: noonOf(request.date).getTime(), until: null, from: request.from, to: request.to, day: true };
};
