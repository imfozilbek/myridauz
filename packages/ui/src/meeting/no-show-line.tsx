import type { Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { meetingOpen, meetOpen } from './meet-state';
import { useNoShowText } from './no-show-text';
import './no-show.css';

type Props = {
  readonly booking: Booking;
  readonly now: number;
  // «Kelmadi» of this passenger (useMeetMark): asked first, then sent.
  readonly onMark: () => void;
  // The usual line of the row, while «Kelmadi» is not possible.
  readonly children: ReactNode;
};

// The line under a passenger of the own trip (docs/129, mockup g63/5 phone 1): from the meeting
// until the trip closes the driver may say the passenger did not come; after it, what became of
// the commission. Otherwise the usual line.
export function NoShowLine({ booking, now, onMark, children }: Props) {
  const { t } = useI18n();
  const text = useNoShowText()(booking);
  if (text) return <span className="no-show-line">{text}</span>;
  const possible = booking.status === 'confirmed' && meetOpen(booking) && meetingOpen(booking.trip, now);
  if (!possible) return <>{children}</>;
  return (
    <button type="button" className="no-show-line no-show-mark" onClick={onMark}>
      {t('driverAfter.noShow.until')}
    </button>
  );
}
