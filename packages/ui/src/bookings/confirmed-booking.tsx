import type { Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { canComplain } from '../feedback/complain-cell';
import { Icon, type IconName } from '../icons';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import { openExternal } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { LoopInvite } from '../growth/loop-invite';
import { DriverRow } from '../trip/driver-row';
import { TripCard } from '../trip/trip-card';
import { BookingBanner, endedBadly } from './booking-banner';
import { DoneTools } from './done-tools';
import { MeetingCard, meetingTime } from './meeting-card';
import { mapUrl } from './map-link';
import { useSeatSteps } from './use-seat-steps';
import './confirmed-booking.css';
import { useCallsOn } from '../call/calls-on';

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
  const moved = booking.trip.firstDepartAt !== booking.trip.departAt;
  useScreenView('bookings.passenger');
  // The page of a past trip has the gradient of docs/121 §5, the booking is flat (mockups g60/1, g60/7).
  useScreenBackground();
  const { t, formatRating } = useI18n();
  const callsOn = useCallsOn();
  const { driver } = booking.trip;
  const brand = useBrand();
  const { colors } = brand.theme;
  const steps = useSeatSteps(booking, onTold);
  const meeting = meetingTime(booking, Date.now(), brand.schedule.meetMinutes);
  const button = (icon: IconName, label: string, onClick: () => void) => (
    <button type="button" className="booking-button" onClick={onClick}>
      <Icon name={icon} size={22} />
      {label}
    </button>
  );
  return (
    <div className="booking-page" style={brandVars(colors)}>
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
      {booking.status === 'completed' ? (
        <>
          <DoneTools booking={booking} onOpen={onOpen} />
          <MainButton text={t('bookings.done.again', { name: driver.firstName })} onClick={onAgain} />
        </>
      ) : (
        <>
          <p className="booking-hint">{t('find.payHint')}</p>
          {children}
          <ActionFailure error={steps.failure} />
          <div className="booking-buttons">
            {button('chat', t('chat.open'), () => onOpen('chat'))}
            {booking.status === 'confirmed' && callsOn
              ? button('phone', t('calls.call'), () => onOpen('call'))
              : null}
            {booking.status === 'confirmed' ? button('share', t('bookings.toClose'), steps.share) : null}
          </div>
          {steps.note ? (
            <p className="booking-hint booking-note">
              {t(`share.${steps.note}`)}
              {steps.note === 'told' ? (
                <button type="button" className="booking-link" onClick={steps.stop}>
                  {t('share.stop')}
                </button>
              ) : null}
            </p>
          ) : null}
          {/* Free seats in the car before it goes: a friend books one by the passenger's own link (G69,
              docs/123 loop 3). */}
          {freeSeats(booking) ? (
            <LoopInvite
              card={{ loop: 'seats', bookingId: booking.id }}
              icon="passengers"
              title={t('growth.seats.title', { seats: String(booking.trip.seatsLeft) })}
              text={t('growth.seats.text')}
              button={t('growth.seats.button')}
            />
          ) : null}
          <div className="booking-links">
            {canComplain(booking.status) ? (
              <button type="button" className="booking-link" onClick={() => onOpen('complaint')}>
                {t('complaints.title')}
              </button>
            ) : null}
            {onCancel ? (
              <button type="button" className="booking-link booking-link-danger" onClick={onCancel}>
                {t(moved ? 'bookings.disagree' : 'bookings.cancel')}
              </button>
            ) : null}
          </div>
          {steps.next ? <MainButton text={t(`share.${steps.next}`)} onClick={steps.step} /> : null}
          {endedBadly(booking.status) ? <MainButton text={t('bookings.others')} onClick={onOthers} /> : null}
        </>
      )}
    </div>
  );
}

// The car still takes people: confirmed, open for booking, not on the way yet.
const freeSeats = ({ status, boardedAt, trip }: Booking) =>
  status === 'confirmed' &&
  boardedAt === null &&
  trip.status === 'active' &&
  trip.departedAt === null &&
  trip.seatsLeft > 0;
