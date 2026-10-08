import type { Booking } from '@platform/contracts';
import { PastRider } from './past-rider';
import { useGivenStars } from './use-given-stars';

type Props = {
  readonly riders: readonly Booking[];
  // The chat is still open after the trip: the call is there too (docs/129).
  readonly talk: boolean;
  readonly onChat: (booking: Booking) => void;
  readonly onCall: (booking: Booking) => void;
};

// The passengers of the past trip with the stars the driver gave. The page mounts it anew when the
// rated ones change (pastRidersKey): the stars just sent are read at once.
export function PastRiders({ riders, talk, onChat, onCall }: Props) {
  const stars = useGivenStars(riders);
  return (
    <div className="past-riders">
      {riders.map((booking) => (
        <PastRider
          key={booking.id}
          booking={booking}
          stars={stars.get(booking.id)}
          talk={talk}
          onChat={() => onChat(booking)}
          onCall={() => onCall(booking)}
        />
      ))}
    </div>
  );
}

// Who is rated now: a new star given mounts the riders again.
export const pastRidersKey = (riders: readonly Booking[]) =>
  riders
    .filter((booking) => booking.rated === true)
    .map((booking) => booking.id)
    .join();
