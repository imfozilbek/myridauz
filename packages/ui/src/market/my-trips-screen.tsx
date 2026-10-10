import {
  DAY_MS,
  MY_TRIP_LINK,
  OFFER_LINK,
  tashkentDate,
  tashkentDayStart,
  type AppLink,
  type Trip,
} from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { DriverBooking } from '../bookings/driver-booking';
import { ChatScreen } from '../chat/chat-screen';
import { useApiClients } from '../context/api-clients';
import { OwnTripFlow } from '../own-trip/own-trip-flow';
import type { TripScreen } from '../own-trip/own-trip-opened';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { sameTrip, type ReturnTrip } from '../trip-end/return-plan';
import { useScreenBackground } from '../telegram/screen-background';
import { useForgetOnLeave } from './list-leave';
import type { MineTab } from './mine-tabs';
import { MY_TRIPS, MyTripsList } from './my-trips-list';
import { NewTripFlow } from './new-trip-flow';
import { PlacesGate, usePlaces } from './places-gate';
import { useLinkOpen } from './use-link-open';
import { useLoad } from './use-list';
import './market.css';
import { waitingRequests } from '../home/home-items';

// "Mening safarlarim" of a driver: the sent offers, every trip with its bookings (docs/35).
type ScreenProps = { readonly onBack: () => void; readonly link?: AppLink; readonly tripScreen?: TripScreen };

export function MyTripsScreen(props: ScreenProps) {
  useForgetOnLeave(MY_TRIPS);
  return (
    <PlacesGate onBack={props.onBack}>
      <MyTrips {...props} />
    </PlacesGate>
  );
}

// What is open, by its ids: a signal brings fresh data to it (docs/65 B2).
type Opened = { readonly tripId: string; readonly bookingId?: string; readonly start?: TripScreen };

function MyTrips({ onBack, link, tripScreen }: ScreenProps) {
  useScreenView('market.my_trips');
  useScreenBackground();
  const { market, bookings } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(
    () => Promise.all([market.myTrips(), bookings.driverBookings(), bookings.driverOffers()]),
    MY_TRIPS,
  );
  const [opened, setOpened] = useState<Opened | null>(null);
  const trip = opened && value ? value[0].find((item) => item.id === opened.tripId) : undefined;
  const booking = opened?.bookingId ? value?.[1].find((item) => item.id === opened.bookingId) : undefined;
  // A bot button opens its booking, trip or the booking of an accepted offer (docs/65 B5).
  useLinkOpen(link, value ?? null, (open, [, booked, offers]) => {
    const bookingId =
      open.name === OFFER_LINK ? offers.find((item) => item.id === open.id)?.bookingId : open.id;
    const found = booked.find((item) => item.id === bookingId && open.name !== MY_TRIP_LINK);
    if (found) setOpened({ tripId: found.trip.id, bookingId: found.id });
    else if (open.name === MY_TRIP_LINK)
      setOpened({ tripId: open.id, ...(tripScreen ? { start: tripScreen } : {}) });
  });
  const [chatKey, setChatKey] = useState<string | null>(null);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [tab, setTab] = useState<MineTab>('live');
  const [again, setAgain] = useState<ReturnTrip | null>(null);
  const directory = usePlaces();
  if (again) return <NewTripFlow route={again.route} again={again.again} onBack={() => setAgain(null)} />;
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  if (chatKey) return <ChatScreen chatKey={chatKey} onBack={() => setChatKey(null)} />;
  if (trip && booking) {
    const close = (changed: boolean) => {
      setOpened({ tripId: trip.id });
      if (changed) reload();
    };
    return <DriverBooking booking={booking} onClose={close} />;
  }
  if (trip && value)
    return (
      <OwnTripFlow
        trip={trip}
        bookings={value[1].filter((item) => item.trip.id === trip.id)}
        onBack={() => setOpened(null)}
        onBooking={(item) => setOpened({ tripId: trip.id, bookingId: item.id })}
        onChanged={reload}
        onClosed={() => (setOpened(null), reload())}
        offer={trip.private ? (value[2].find((item) => item.tripId === trip.id) ?? null) : null}
        {...(opened?.start ? { start: opened.start } : {})}
      />
    );
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const [trips, booked, offers] = value;
  return (
    <MyTripsList
      trips={trips}
      booked={booked}
      waiting={(item) => waitingRequests(item, booked)}
      offers={offers}
      onBack={onBack}
      onRefresh={refresh}
      onTrip={(item) => setOpened({ tripId: item.id })}
      onOffer={(offer) => setChatKey(offer.chatKey)}
      onSubscriptions={() => setSubscriptionsOpen(true)}
      tab={tab}
      onTab={setTab}
      onAgain={(last) => setAgain(sameTrip(last, directory, tomorrowAt(last)))}
    />
  );
}

// «Ertaga shu safar»: tomorrow of Tashkent at the time of the day of the trip (mockup g64/6).
function tomorrowAt(trip: Trip): number {
  const inDay = trip.departAt - tashkentDayStart(tashkentDate(trip.departAt));
  return tashkentDayStart(tashkentDate(Date.now() + DAY_MS)) + inDay;
}
