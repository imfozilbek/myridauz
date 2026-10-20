import { isGone, type Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { CoRiders } from './co-riders';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { openExternal } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { useOpenSupport } from '../telegram/support-link';
import { brandVars } from '../theme/brand-vars';
import { DriverRow } from '../trip/driver-row';
import { TripCard } from '../trip/trip-card';
import { BookingBanner } from './booking-banner';
import { DoneTools } from './done-tools';
import { LiveSeatTools } from './live-seat-tools';
import { MeetingCard, meetingTime } from './meeting-card';
import { mapUrl } from './map-link';
import { useSeatSteps } from './use-seat-steps';
import './confirmed-booking.css';

type Props = {
  readonly booking: Booking;
  readonly onBack: () => void;
  // The chat, the call (the chat that rings at once), the complaint or the review.
  readonly onOpen: (screen: 'chat' | 'call' | 'complaint' | 'review') => void;
  // Null when the seat is used or the trip went: nothing to cancel (docs/35).
  readonly onCancel: (() => void) | null;
  readonly onTold: (booking: Booking) => void;
  // «Yana Jasur bilan» after the trip (mockup g60/7); «Oʻxshash safarlar» after a bad end (docs/124 А).
  readonly onAgain: () => void;
  readonly onOthers: () => void;
  readonly children?: ReactNode;
};

// The page of a confirmed seat (owner decision 06.10.2026, docs/118 path 3, mockup g60/1): who,
// which car, where; three big buttons; one main button that follows the trip.
export function ConfirmedBooking(props: Props) {
  const { booking, onBack, onOpen, onCancel, onTold, onAgain, onOthers, children } = props;
  useScreenView('bookings.passenger');
  // The page of a past trip has the gradient of docs/121 §5, the booking is flat (mockups g60/1, g60/7).
  useScreenBackground();
  const { t, formatRating } = useI18n();
  const { driver } = booking.trip;
  const gone = isGone(driver); // a deleted account: nobody to write, call or ride with (G89 M9)
  const brand = useBrand();
  const steps = useSeatSteps(booking, onTold);
  const support = useOpenSupport();
  // The driver marked «Kelmadi»: the seat is not ridden, nothing of a live seat is left (G90 PAS-1).
  const missed = booking.noShowAt !== null;
  const meeting = !missed && meetingTime(booking, Date.now(), brand.schedule.meetMinutes);
  return (
    <div className="booking-page" style={brandVars(brand.theme.colors)}>
      <Screen onBack={onBack} />
      <BookingBanner booking={booking} />
      {meeting ? <MeetingCard booking={booking} onOpen={onOpen} onTold={onTold} /> : null}
      <div className="booking-card">
        {/* At the meeting the driver is in its card: no second row of him (G78 sheet 2). */}
        {meeting ? null : (
          <DriverRow
            driver={driver}
            car={driver.car}
            note={
              driver.rating.average === null
                ? null
                : t('find.stars', { rating: formatRating(driver.rating.average) })
            }
            plate={booking.plate}
          />
        )}
        <TripCard booking={booking} onPoint={(point) => openExternal(mapUrl(point))} />
      </div>
      {booking.status === 'confirmed' ? <CoRiders bookingId={booking.id} /> : null}
      {booking.status === 'completed' ? (
        <>
          <DoneTools booking={booking} onOpen={onOpen} missed={missed} />
          {missed ? (
            <MainButton text={t('home.support')} onClick={() => support()} />
          ) : gone ? null : (
            <MainButton text={t('bookings.done.again', { name: driver.firstName })} onClick={onAgain} />
          )}
        </>
      ) : (
        <LiveSeatTools
          booking={booking}
          steps={steps}
          onOpen={onOpen}
          onCancel={onCancel}
          onOthers={onOthers}
          missed={missed}
        >
          {children}
        </LiveSeatTools>
      )}
    </div>
  );
}
