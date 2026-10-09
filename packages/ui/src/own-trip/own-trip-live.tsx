import type { Booking, Offer, Trip } from '@platform/contracts';
import { useState } from 'react';
import { DriverTripMap } from '../bookings/driver-trip-map';
import { NotEnoughScreen, TopUpScreen } from '../bookings/wallet-steps';
import { ChatScreen } from '../chat/chat-screen';
import { useI18n } from '../context/i18n-context';
import { TripChangeScreen } from '../market/trip-change';
import { DriverMeeting } from '../meeting/driver-meeting';
import { meetingOpen } from '../meeting/meet-state';
import { useMeetMark } from '../meeting/use-meet-mark';
import { ActionFailure } from '../states/action-failure';
import { ChangeChoice } from './change-choice';
import type { Opened } from './own-trip-opened';
import { OwnTripPage } from './own-trip-page';
import { tripStage } from './trip-stage';
import { useNow } from './use-now';
import { useOwnTripActions } from './use-own-trip-actions';
import { useTripSteps } from './use-trip-steps';

export type OwnTripProps = {
  readonly trip: Trip;
  // The bookings of this trip, fresh on each signal (docs/64).
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  // One booking with its deadline, points, cancel and complaint (DriverBooking, by its id).
  readonly onBooking: (booking: Booking) => void;
  readonly onChanged: () => void;
  // The trip was cancelled: back to the list.
  readonly onClosed: () => void;
  // The offer on a private trip of a «Boʻsh salon kerak» request (G64).
  readonly offer?: Offer | null;
};

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
  const [opened, setOpened] = useState<Opened | null>(null);
  // The passengers of the point whose meeting is open.
  const [meeting, setMeeting] = useState<readonly string[] | null>(null);
  const now = useNow();
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
  if (opened?.screen === 'not_enough')
    return (
      <NotEnoughScreen
        amount={opened.booking.commission}
        onBack={back}
        onTopUp={() => setOpened({ ...opened, screen: 'top_up' })}
      />
    );
  if (opened?.screen === 'top_up')
    return <TopUpScreen onBack={() => setOpened({ ...opened, screen: 'not_enough' })} />;
  if (opened?.screen === 'map')
    return (
      <DriverTripMap
        trip={trip}
        bookings={bookings.filter((item) => item.status === 'confirmed')}
        now={now}
        onPoint={meetingOpen(trip, now) ? (stop) => setMeeting(stop.riders.map(({ id }) => id)) : null}
        onBack={back}
      />
    );
  if (opened?.screen === 'choice')
    return (
      <ChangeChoice
        trip={trip}
        onChange={(change) => setOpened({ screen: 'change', change })}
        onBack={back}
      />
    );
  if (opened?.screen === 'change')
    return <TripChangeScreen trip={trip} change={opened.change} onDone={() => (back(), onChanged())} />;
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
    </OwnTripPage>
  );
}
