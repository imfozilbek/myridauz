import { isGone, type Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useCallsOn } from '../call/calls-on';
import { useI18n } from '../context/i18n-context';
import { useCanComplain } from '../feedback/complain-cell';
import { LoopInvite } from '../growth/loop-invite';
import { Icon, type IconName } from '../icons';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import { useOpenSupport } from '../telegram/support-link';
import { endedBadly } from './booking-banner';
import type { useSeatSteps } from './use-seat-steps';

type Props = {
  readonly booking: Booking;
  readonly steps: ReturnType<typeof useSeatSteps>;
  readonly onOpen: (screen: 'chat' | 'call' | 'complaint' | 'review') => void;
  readonly onCancel: (() => void) | null;
  readonly onOthers: () => void;
  // The driver marked «Kelmadi»: the chat and support are left, as on the main screen (G90 PAS-1).
  readonly missed: boolean;
  readonly children?: ReactNode;
};

// The page of a seat before and during the trip (mockup g60/1): three big buttons, the links, one
// main button that follows the trip.
export function LiveSeatTools({ booking, steps, onOpen, onCancel, onOthers, missed, children }: Props) {
  const { t } = useI18n();
  const callsOn = useCallsOn();
  const canComplain = useCanComplain();
  const support = useOpenSupport();
  const gone = isGone(booking.trip.driver); // a deleted account: nobody to write or call (G89 M9)
  const moved = booking.trip.firstDepartAt !== booking.trip.departAt;
  const live = booking.status === 'confirmed' && !missed;
  const button = (icon: IconName, label: string, onClick: () => void) => (
    <button type="button" className="booking-button" onClick={onClick}>
      <Icon name={icon} size={22} />
      {label}
    </button>
  );
  return (
    <>
      <p className="booking-hint">{t('find.payHint')}</p>
      {children}
      <ActionFailure error={steps.failure} />
      <div className="booking-buttons">
        {gone ? null : button('chat', t('chat.open'), () => onOpen('chat'))}
        {live && callsOn && !gone ? button('phone', t('calls.call'), () => onOpen('call')) : null}
        {live ? button('share', t('bookings.toClose'), steps.share) : null}
      </div>
      <SeatNote steps={steps} />
      {/* Free seats in the car before it goes: a friend books one by the passenger's own link (G69,
          docs/123 loop 3). */}
      {live && freeSeats(booking) ? (
        <LoopInvite
          card={{ loop: 'seats', bookingId: booking.id }}
          icon="passengers"
          title={t('growth.seats.title', { seats: String(booking.trip.seatsLeft) })}
          text={t('growth.seats.text')}
          button={t('growth.seats.button')}
        />
      ) : null}
      <div className="booking-links">
        {canComplain(booking) ? (
          <button type="button" className="booking-link" onClick={() => onOpen('complaint')}>
            {t('complaints.title')}
          </button>
        ) : null}
        {onCancel && !missed ? (
          <button type="button" className="booking-link booking-link-danger" onClick={onCancel}>
            {t(moved ? 'bookings.disagree' : 'bookings.cancel')}
          </button>
        ) : null}
      </div>
      {missed ? <MainButton text={t('home.support')} onClick={() => support()} /> : null}
      {steps.next && !missed ? <MainButton text={t(`share.${steps.next}`)} onClick={steps.step} /> : null}
      {endedBadly(booking.status) ? <MainButton text={t('bookings.others')} onClick={onOthers} /> : null}
    </>
  );
}

// The car still takes people: confirmed, open for booking, not on the way yet.
const freeSeats = ({ status, boardedAt, trip }: Booking) =>
  status === 'confirmed' &&
  boardedAt === null &&
  trip.status === 'active' &&
  trip.departedAt === null &&
  trip.seatsLeft > 0;

// What the last step told the close people, with «stop» while they follow (docs/43); it stays on the
// page after the arrival too (G90 PAS-7).
export function SeatNote({ steps }: { readonly steps: ReturnType<typeof useSeatSteps> }) {
  const { t } = useI18n();
  if (!steps.note) return null;
  return (
    <p className="booking-hint booking-note">
      {t(`share.${steps.note}`)}
      {steps.note === 'told' ? (
        <button type="button" className="booking-link" onClick={steps.stop}>
          {t('share.stop')}
        </button>
      ) : null}
    </p>
  );
}
