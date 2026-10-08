import type { Booking, Trip } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { ChatScreen } from '../chat/chat-screen';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import type { TripDraft } from '../market/trip-draft';
import { useNow } from '../own-trip/use-now';
import { ActionFailure } from '../states/action-failure';
import { PastTripFlow } from '../trip-end/past-trip-flow';
import { ReturnPublish } from '../trip-end/return-publish';
import { DriverMeeting } from './driver-meeting';
import { meetingOpen, meetingPoints } from './meet-state';
import { NoShowBanners } from './no-show-banners';
import { NoShowLine } from './no-show-line';
import { useMeetMark } from './use-meet-mark';

type Parts = {
  // On top of the own trip: the plates of «Kelmadi» and the way into «Uchrashuv».
  readonly top: ReactNode;
  // The line of a passenger: «Kelmadi» until the trip closes (NoShowLine), else the usual line of
  // the row (a text, or the RiderLine of «Mening safarim»).
  readonly line: (booking: Booking, usual: ReactNode) => ReactNode;
};

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  readonly onChanged: () => void;
  readonly children: (parts: Parts) => ReactNode;
};

// «Yozish» or «Qoʻngʻiroq» of a passenger at the meeting: the call rings as soon as the chat allows.
type Talk = { readonly booking: Booking; readonly ring: boolean };

// The meeting and the end of the own trip (G63 C3) on the trip page of the driver: the past trip
// once it is over, «Uchrashuv» from the meeting time, «Kelmadi» in the rows. The time moves on by
// itself, so the way into the meeting shows when it opens.
export function OwnTripSeam({ trip, bookings, onBack, onChanged, children }: Props) {
  const { t } = useI18n();
  const now = useNow();
  const [meeting, setMeeting] = useState(false);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [publish, setPublish] = useState<Partial<TripDraft> | null>(null);
  const { mark, failure } = useMeetMark(onChanged);
  if (publish) return <ReturnPublish draft={publish} onBack={() => setPublish(null)} />;
  if (trip.status === 'completed')
    return (
      <PastTripFlow
        trip={trip}
        bookings={bookings}
        onBack={onBack}
        onChanged={onChanged}
        onPublish={setPublish}
      />
    );
  if (talk)
    return (
      <ChatScreen
        chatKey={talk.booking.chatKey}
        title={talk.booking.passenger.firstName}
        ring={talk.ring}
        onBack={() => setTalk(null)}
      />
    );
  if (meeting)
    return (
      <DriverMeeting
        bookings={bookings}
        onBack={() => setMeeting(false)}
        onChanged={onChanged}
        onChat={(booking) => setTalk({ booking, ring: false })}
        onCall={(booking) => setTalk({ booking, ring: true })}
      />
    );
  const open = meetingOpen(trip, now) && meetingPoints(bookings).length > 0;
  return children({
    top: (
      <>
        <NoShowBanners bookings={bookings} />
        {open ? (
          <Section>
            <Cell before={<IconTile name="pickup" tone="accent" />} onClick={() => setMeeting(true)}>
              {t('bookings.meeting.title')}
            </Cell>
          </Section>
        ) : null}
        <ActionFailure error={failure} />
      </>
    ),
    line: (booking, usual) => (
      <NoShowLine booking={booking} now={now} onMark={() => void mark(booking, 'no_show')}>
        {usual}
      </NoShowLine>
    ),
  });
}
