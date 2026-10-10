import type { Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { meetingOpen, meetOpen } from './meet-state';
import { refundWaits, useNoShowText } from './no-show-text';
import './no-show.css';
import { useBrand } from '../context/brand-context';

type Props = {
  readonly booking: Booking;
  readonly now: number;
  // «Kelmadi» of this passenger (useMeetMark): asked first, then sent.
  readonly onMark: () => void;
  // The usual line of the row, while «Kelmadi» is not possible.
  readonly children: ReactNode;
  // The past trip: the driver said «Yetib keldik», though the trip read before may still be on the way.
  readonly ended?: boolean;
};

// The line under a passenger of the own trip (docs/129, mockup g63/5 phone 1): once the driver is at
// the point («Men keldim», docs/126) and until the trip closes, the driver may say the passenger did
// not come. Once said, the line stays on the way while the refund waits (the plate on top tells about
// it, as on the mockup); after the trip, what became of the commission (phone 5). Otherwise the usual
// line, as on «Joʻnashga 30 daqiqa» and «Yoʻldasiz» (mockup g63/4 screens 11 and 14).
export function NoShowLine({ booking, now, onMark, children, ended = false }: Props) {
  const { t } = useI18n();
  const text = useNoShowText()(booking);
  const { meetMinutes } = useBrand().schedule;
  const onWay = !ended && booking.trip.arrivedAt === null && meetingOpen(booking.trip, now, meetMinutes);
  if (onWay && refundWaits(booking))
    return <span className="no-show-line">{t('driverAfter.noShow.until')}</span>;
  if (text) return <span className="no-show-line">{text}</span>;
  const there = booking.driverCameAt !== null;
  const possible =
    booking.status === 'confirmed' &&
    there &&
    meetOpen(booking) &&
    meetingOpen(booking.trip, now, meetMinutes);
  if (!possible) return <>{children}</>;
  return (
    <button
      type="button"
      className="no-show-line no-show-mark"
      onClick={(event) => {
        // The row around the line opens the booking: a tap on «Kelmadi» stays with the mark.
        event.stopPropagation();
        onMark();
      }}
    >
      {t('driverAfter.noShow.until')}
    </button>
  );
}
