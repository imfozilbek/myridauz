import { MY_TRIP_LINK, OFFER_LINK, type AppLink, type Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { DriverBooking } from '../bookings/driver-booking';
import { DriverTripMap } from '../bookings/driver-trip-map';
import { ChatScreen } from '../chat/chat-screen';
import { DriverShare } from '../comfort/driver-share';
import { TripBookings } from '../bookings/trip-bookings';
import { OwnTripSeam } from '../meeting/own-trip-seam';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { confirm, haptic } from '../telegram/feedback';
import { ActionFailure } from '../states/action-failure';
import { errorKey } from './error-text';
import { useScreenBackground } from '../telegram/screen-background';
import { useForgetOnLeave } from './list-leave';
import { MY_TRIPS, MyTripsList } from './my-trips-list';
import { PlacesGate } from './places-gate';
import { TripChangeCells, TripChangeScreen, type TripChange } from './trip-change';
import { TripScreen } from './trip-screen';
import { useLinkOpen } from './use-link-open';
import { useLoad } from './use-list';
import './market.css';
import { waitingRequests } from '../home/home-items';

// "Mening safarlarim" of a driver: the sent offers, every trip with its bookings (docs/35).
type ScreenProps = { readonly onBack: () => void; readonly link?: AppLink };

export function MyTripsScreen({ onBack, link }: ScreenProps) {
  useForgetOnLeave(MY_TRIPS);
  return (
    <PlacesGate onBack={onBack}>
      <MyTrips onBack={onBack} {...(link ? { link } : {})} />
    </PlacesGate>
  );
}

// What is open, by its ids: a signal brings fresh data to it (docs/65 B2).
type Opened = { readonly tripId: string; readonly bookingId?: string };

function MyTrips({ onBack, link }: ScreenProps) {
  useScreenView('market.my_trips');
  useScreenBackground();
  const { t } = useI18n();
  const { market, bookings } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(
    () => Promise.all([market.myTrips(), bookings.driverBookings(), bookings.driverOffers()]),
    MY_TRIPS,
  );
  const [opened, setOpened] = useState<Opened | null>(null);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
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
  const [mapOpen, setMapOpen] = useState(false);
  const [change, setChange] = useState<TripChange | null>(null);
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  // A cancel is asked first; a failed one keeps the trip open with the reason (docs/65 B3, B4).
  const cancel = async (open: Trip) => {
    if (!(await confirm(t('market.trip.cancelAsk'), t('market.trip.cancel')))) return;
    try {
      setFailure(null);
      await market.cancelTrip(open.id);
      haptic.success();
      setOpened(null);
      reload();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
  if (chatKey) return <ChatScreen chatKey={chatKey} onBack={() => setChatKey(null)} />;
  if (trip && booking && value) {
    const close = (changed: boolean) => {
      setOpened({ tripId: trip.id });
      if (changed) reload();
    };
    // The map of a confirmed booking goes back to that booking, not to its trip (docs/94 B8).
    const ofTrip = value[1].filter((item) => item.trip.id === trip.id);
    if (mapOpen) return <DriverTripMap bookings={ofTrip} onBack={() => setMapOpen(false)} />;
    const toMap = () => (reload(), setMapOpen(true));
    return <DriverBooking booking={booking} onClose={close} onMap={toMap} />;
  }
  if (trip && change)
    return <TripChangeScreen trip={trip} change={change} onDone={() => (setChange(null), reload())} />;
  if (trip && value) {
    const back = () => (setOpened(null), setFailure(null), setMapOpen(false));
    // A trip ahead may move later or get cheaper (G39, docs/104).
    const ahead = (trip.status === 'active' || trip.status === 'full') && trip.departAt > Date.now();
    const ofTrip = value[1].filter((item) => item.trip.id === trip.id);
    if (mapOpen) return <DriverTripMap bookings={ofTrip} onBack={() => setMapOpen(false)} />;
    // The meeting and the end of the trip (G63 C3): the lead moves them into «Mening safarim» of C2.
    return (
      <OwnTripSeam trip={trip} bookings={ofTrip} onBack={back} onChanged={reload}>
        {(seam) => (
          <TripScreen trip={trip} onBack={back} onCancel={() => void cancel(trip)} own>
            {seam.top}
            <ActionFailure error={failure} />
            {ahead ? <TripChangeCells trip={trip} onChange={setChange} /> : null}
            <TripBookings
              bookings={ofTrip}
              line={seam.line}
              onOpen={(item) => setOpened({ tripId: trip.id, bookingId: item.id })}
              onMap={() => setMapOpen(true)}
            />
            <DriverShare trip={trip} />
          </TripScreen>
        )}
      </OwnTripSeam>
    );
  }
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
    />
  );
}
