import { MY_TRIP_LINK, OFFER_LINK, type AppLink, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { DriverBooking } from '../bookings/driver-booking';
import { ChatScreen } from '../chat/chat-screen';
import { useApiClients } from '../context/api-clients';
import { OwnTripFlow } from '../own-trip/own-trip-flow';
import type { TripStep } from '../own-trip/trip-stage';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { useForgetOnLeave } from './list-leave';
import { MY_TRIPS, MyTripsList } from './my-trips-list';
import { PlacesGate } from './places-gate';
import { useLinkOpen } from './use-link-open';
import { useLoad } from './use-list';
import './market.css';
import { waitingRequests } from '../home/home-items';

// "Mening safarlarim" of a driver: the sent offers, every trip with its bookings (docs/35).
type ScreenProps = {
  readonly onBack: () => void;
  readonly link?: AppLink;
  // «Yoʻlga chiqdim» and «Yetib keldik» of a trip on the server (G63 B1): the main button of
  // «Mening safarim» shows once the app gives it.
  readonly onTripStep?: (trip: Trip, step: TripStep) => unknown;
};

export function MyTripsScreen(props: ScreenProps) {
  useForgetOnLeave(MY_TRIPS);
  return (
    <PlacesGate onBack={props.onBack}>
      <MyTrips {...props} />
    </PlacesGate>
  );
}

// What is open, by its ids: a signal brings fresh data to it (docs/65 B2).
type Opened = { readonly tripId: string; readonly bookingId?: string };

function MyTrips({ onBack, link, onTripStep }: ScreenProps) {
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
    else if (open.name === MY_TRIP_LINK) setOpened({ tripId: open.id });
  });
  const [chatKey, setChatKey] = useState<string | null>(null);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  if (chatKey) return <ChatScreen chatKey={chatKey} onBack={() => setChatKey(null)} />;
  if (trip && booking) {
    const close = (changed: boolean) => {
      setOpened({ tripId: trip.id });
      if (changed) reload();
    };
    return <DriverBooking booking={booking} onClose={close} />;
  }
  if (trip && value) {
    const step = onTripStep;
    return (
      <OwnTripFlow
        trip={trip}
        bookings={value[1].filter((item) => item.trip.id === trip.id)}
        onBack={() => setOpened(null)}
        onBooking={(item) => setOpened({ tripId: trip.id, bookingId: item.id })}
        onChanged={reload}
        onClosed={() => (setOpened(null), reload())}
        onStep={step ? (next: TripStep) => step(trip, next) : undefined}
      />
    );
  }
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const [trips, booked, offers] = value;
  return (
    <MyTripsList
      trips={trips}
      waiting={(item) => waitingRequests(item, booked)}
      offers={offers}
      onBack={onBack}
      onRefresh={refresh}
      onTrip={(item) => setOpened({ tripId: item.id })}
      onOffer={(offer) => setChatKey(offer.chatKey)}
      onSubscriptions={() => setSubscriptionsOpen(true)}
    />
  );
}
