import type { Booking, Trip } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { ChatScreen } from '../chat/chat-screen';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import type { TripDraft } from '../market/trip-draft';
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
  // The line of a passenger: «Kelmadi» until the trip closes (NoShowLine).
  readonly line: (booking: Booking, usual: string) => ReactNode;
};

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  readonly onChanged: () => void;
  readonly children: (parts: Parts) => ReactNode;
};

// The meeting and the end of the own trip (G63 C3) on the trip page of the driver: the past trip
// once it is over, «Uchrashuv» from the meeting time, «Kelmadi» in the rows.
export function OwnTripSeam({ trip, bookings, onBack, onChanged, children }: Props) {
  const { t } = useI18n();
  const [opened, setOpened] = useState<'meeting' | Booking | null>(null);
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
  if (opened && opened !== 'meeting')
    return (
      <ChatScreen
        chatKey={opened.chatKey}
        title={opened.passenger.firstName}
        onBack={() => setOpened('meeting')}
      />
    );
  if (opened === 'meeting')
    return (
      <DriverMeeting
        bookings={bookings}
        onBack={() => setOpened(null)}
        onChanged={onChanged}
        onChat={setOpened}
        onCall={setOpened}
      />
    );
  const now = Date.now();
  const meeting = meetingOpen(trip, now) && meetingPoints(bookings).length > 0;
  return children({
    top: (
      <>
        <NoShowBanners bookings={bookings} />
        {meeting ? (
          <Section>
            <Cell before={<IconTile name="pickup" tone="accent" />} onClick={() => setOpened('meeting')}>
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
