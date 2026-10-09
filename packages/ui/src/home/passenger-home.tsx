import { BOOKING_LINK } from '@platform/contracts';
import { useState } from 'react';
import { MeetingCard, meetingTime } from '../bookings/meeting-card';
import type { HomeGo } from '../flow/start-action';
import { useDirectory } from '../places/use-directory';
import { Screen } from '../screen/screen';
import { ArrivedSheet, asksArrival } from './arrived-sheet';
import { FavoriteSheet } from './favorite-sheet';
import { HomeFailed } from './home-state';
import { HomeTripCard } from './home-trip-card';
import { nextBookings } from './home-items';
import { usePassengerData, type PassengerLoad } from './passenger-data';
import { TALK_CALL, TRIP_TALK } from './trip-talk';
import { useHomeTap } from './use-home-tap';

// The main screen of a passenger (G25, G66, docs/118): the nearest seat as one card under the profile,
// the meeting instead of it 30 minutes before the departure (docs/126). Search lives at the bottom.
export function PassengerHome({ go }: { readonly go: HomeGo }) {
  const load = usePassengerData();
  // A pull down at the top of the main screen refreshes the bookings (docs/94 W1).
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <Seat go={go} load={load} />
      <ArrivedSheet bookings={load.value?.[0] ?? []} onTold={load.refresh} />
      {load.value && !load.value[0].some((booking) => asksArrival(booking, Date.now())) ? (
        <FavoriteSheet go={go} bookings={load.value[0]} />
      ) : null}
    </>
  );
}

type SeatProps = { readonly go: HomeGo; readonly load: PassengerLoad };

function Seat({ go, load: { value, failed, reload, refresh } }: SeatProps) {
  const [places] = useDirectory();
  const tap = useHomeTap();
  const [now] = useState(Date.now);
  if (failed) return <HomeFailed onRetry={reload} />;
  const booking = value ? nextBookings(value[0])[0] : undefined;
  if (!booking) return null;
  if (meetingTime(booking, now)) return <MeetingCard booking={booking} onTold={refresh} />;
  const link = (name: string) => ({ link: { name, id: booking.id } });
  return (
    <HomeTripCard
      booking={booking}
      directory={places.status === 'ready' ? places.directory : null}
      onOpen={tap('item', () => go('my_trips', link(BOOKING_LINK)))}
      onTalk={(screen) =>
        tap(screen === 'call' ? 'trip_call' : 'trip_chat', () =>
          go(TRIP_TALK, link(screen === 'call' ? TALK_CALL : 'chat')),
        )()
      }
    />
  );
}
