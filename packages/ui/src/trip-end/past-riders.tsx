import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { NoShowLine } from '../meeting/no-show-line';
import { useNoShowText } from '../meeting/no-show-text';
import { RiderRow } from '../own-trip/rider-row';
import { useGivenStars } from './use-given-stars';

type Props = {
  readonly riders: readonly Booking[];
  // The chat is still open after the trip: the call is there too (docs/129).
  readonly talk: boolean;
  readonly onChat: (booking: Booking) => void;
  readonly onCall: (booking: Booking) => void;
  // «Kelmadi» stays possible after «Yetib keldik» until the trip closes (docs/129).
  readonly now: number;
  readonly onMark: (booking: Booking) => void;
};

// The passengers of the past trip (mockup g63/5 phone 5) in the rows of «Mening safarim»: the stars
// the driver gave, or what became of the commission of a passenger who did not come. The page
// mounts it anew when the rated ones change (pastRidersKey): the stars just sent are read at once.
export function PastRiders({ riders, talk, onChat, onCall, now, onMark }: Props) {
  const { t } = useI18n();
  const stars = useGivenStars(riders);
  const noShow = useNoShowText();
  const line = (booking: Booking) => {
    const missed = noShow(booking);
    if (missed) return <span className="no-show-line">{missed}</span>;
    const given = stars.get(booking.id);
    if (given === undefined) return null;
    const text = t('driverAfter.past.rated', { stars: t('find.star').repeat(given) });
    return <span className="rider-line">{text}</span>;
  };
  return (
    <div className="own-riders">
      {riders.map((booking) => (
        <RiderRow
          key={booking.id}
          booking={booking}
          onChat={() => onChat(booking)}
          onCall={talk ? () => onCall(booking) : undefined}
          line={(usual) => (
            <NoShowLine booking={booking} now={now} onMark={() => onMark(booking)} ended>
              {line(booking) ?? usual}
            </NoShowLine>
          )}
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
