import { useState } from 'react';
import { DriverTripMap } from '../bookings/driver-trip-map';
import { ChatScreen } from '../chat/chat-screen';
import { useI18n } from '../context/i18n-context';
import { TripChangeSheet } from '../market/trip-change';
import { ShortfallSheet } from '../wallet/shortfall-sheet';
import { short } from '../bookings/use-balance';
import { RequestSheet } from './request-sheet';
import { DriverMeeting } from '../meeting/driver-meeting';
import { meetingOpen } from '../meeting/meet-state';
import { useMeetMark } from '../meeting/use-meet-mark';
import { ActionFailure } from '../states/action-failure';
import type { Opened, OwnTripProps } from './own-trip-opened';
import { OwnTripPage } from './own-trip-page';
import { tripStage } from './trip-stage';
import { useNow } from './use-now';
import { useOwnTripActions } from './use-own-trip-actions';
import { useTripSteps } from './use-trip-steps';
import { useBrand } from '../context/brand-context';

type Props = OwnTripProps & {
  // «Yetib keldik» went through: the end of the trip (OwnTripFlow).
  readonly onArrived: () => void;
};

// «Mening safarim» with what opens from it (G63, docs/118 path 6): the chat and the call of a
// passenger, the wallet when a commission is short, the map of the way, the change of G39. A point
// of the map opens its «Uchrashuv» with its own chat and call (mockup g63/4 screens 12, 13).
export function OwnTripLive(props: Props) {
  const { trip, bookings, onBack, onBooking, onChanged, onClosed, onArrived, offer = null } = props;
  const { t } = useI18n();
  const [opened, setOpened] = useState<Opened | null>(props.start === 'map' ? { screen: 'map' } : null);
  // The passengers of the point whose meeting is open.
  const [meeting, setMeeting] = useState<readonly string[] | null>(null);
  const now = useNow();
  const { meetMinutes } = useBrand().schedule;
  const stage = tripStage(trip, now);
  const actions = useOwnTripActions({ trip, stage, bookings, open: setOpened, onChanged, onClosed });
  const steps = useTripSteps({ trip, onChanged, onArrived });
  const meet = useMeetMark(() => onChanged());
  const back = () => setOpened(null);
  if (opened?.screen === 'chat' || opened?.screen === 'call')
    return (
      <ChatScreen
        chatKey={opened.booking.chatKey}
        title={opened.booking.passenger.firstName}
        ring={opened.screen === 'call'}
        onBack={back}
      />
    );
  if (meeting)
    return (
      <DriverMeeting
        bookings={bookings}
        only={meeting}
        onBack={() => setMeeting(null)}
        onChanged={() => onChanged()}
        onChat={(booking) => setOpened({ screen: 'chat', booking })}
        onCall={(booking) => setOpened({ screen: 'call', booking })}
      />
    );
  if (opened?.screen === 'map')
    return (
      <DriverTripMap
        trip={trip}
        bookings={bookings.filter((item) => item.status === 'confirmed')}
        now={now}
        onPoint={
          meetingOpen(trip, now, meetMinutes) ? (stop) => setMeeting(stop.riders.map(({ id }) => id)) : null
        }
        onBack={back}
      />
    );
  return (
    <OwnTripPage
      trip={trip}
      stage={stage}
      now={now}
      bookings={bookings}
      balance={actions.balance}
      onBack={onBack}
      onAnswer={actions.answer}
      onOpen={(booking, screen) =>
        screen === 'booking' ? onBooking(booking) : setOpened({ screen, booking })
      }
      onTile={actions.tile}
      onCancel={actions.cancel}
      onStep={steps.step}
      onMark={(booking) => void meet.mark(booking, 'no_show')}
      offer={offer}
      onOpened={onChanged}
    >
      <ActionFailure error={steps.failure ?? meet.failure ?? actions.failure} />
      {actions.note ? <p className="own-note">{t(actions.note)}</p> : null}
      {actions.share.told ? (
        <p className="own-note">
          {t(`share.${actions.share.told}`)}
          {actions.share.told === 'told' ? (
            <button type="button" className="own-note-link" onClick={() => void actions.share.stop()}>
              {t('share.stop')}
            </button>
          ) : null}
        </p>
      ) : null}
      {/* A request opened from its name: a sheet over the trip (G75, mockup g75/4 B phone 1). */}
      <RequestSheet
        booking={opened?.screen === 'request' ? opened.booking : null}
        short={opened?.screen === 'request' && short(actions.balance, opened.booking.commission)}
        onAnswer={(booking, action) => (back(), actions.answer(booking, action))}
        onTopUp={(booking) => setOpened({ screen: 'not_enough', booking })}
        onChat={(booking) => setOpened({ screen: 'chat', booking })}
        onClose={back}
      />
      {/* No money for a seat: only the sum short, over the trip (G75, mockup g75/4 B). */}
      <ShortfallSheet
        shortfall={
          opened?.screen === 'not_enough'
            ? {
                need: opened.booking.commission,
                seats: opened.booking.seats,
                name: opened.booking.passenger.firstName,
              }
            : null
        }
        onClose={back}
      />
      {/* «Vaqt yoki narx» is a sheet over the trip (G75, mockup g75/3 A phone 2). */}
      {opened?.screen === 'change' ? (
        <TripChangeSheet trip={trip} open onClose={back} onDone={() => (back(), onChanged())} />
      ) : null}
    </OwnTripPage>
  );
}
