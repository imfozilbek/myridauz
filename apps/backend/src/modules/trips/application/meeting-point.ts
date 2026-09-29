import { isLive } from '../domain/trip';
import type { TripsDeps } from './ports';

type Point = { readonly lat: number; readonly lng: number };

// The driver answers the bot message of a trip with a Telegram location (docs/14).
// The point is shown to a passenger only after a booking is confirmed (G08).
export async function setMeetingPoint(
  deps: TripsDeps,
  driverId: number,
  messageId: number,
  point: Point,
): Promise<'saved' | 'not_found'> {
  const trip = await deps.trips.byMeetingMessage(driverId, messageId);
  if (!trip || !isLive(trip, deps.now())) return 'not_found';
  await deps.trips.save({ ...trip, meetingPoint: point });
  return 'saved';
}
