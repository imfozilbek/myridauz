import { tashkentDate, type Booking, type Offer, type Trip } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { SentOffers } from '../bookings/sent-offers';
import { List } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { AgainCard } from '../driver-trips/again-card';
import { DriverTripRow } from '../driver-trips/driver-trip-row';
import { MonthTotal } from '../driver-trips/month-total';
import { isLive, isWayBack, tripToRepeat, weekOf } from '../driver-trips/trip-week';
import { WeekRow } from '../driver-trips/week-row';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { brandVars } from '../theme/brand-vars';
import { PastTripTags } from '../trip-end/past-trip-tags';
import { MineTabs, type MineTab } from './mine-tabs';
import { Paged } from './paged';
import { TripCard } from './trip-card';

// The memory of the driver's «Mening safarlarim»: data, pages and place (docs/94 F2).
export const MY_TRIPS = 'market.mine.trips';
const byTime = (a: Trip, b: Trip) => a.departAt - b.departAt;

type Props = {
  readonly trips: readonly Trip[];
  // The bookings of the driver: a past trip says what is left on its card (G63, docs/129).
  readonly booked: readonly Booking[];
  // How many new requests wait for the driver's answer on each trip (G41, docs/90 F-D4).
  readonly waiting: (trip: Trip) => number;
  readonly offers: readonly Offer[];
  readonly tab: MineTab;
  readonly onTab: (tab: MineTab) => void;
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
  readonly onTrip: (trip: Trip) => void;
  readonly onOffer: (offer: Offer) => void;
  // «Ertaga shu safar»: the last trip again, tomorrow at its time (mockup g64/6).
  readonly onAgain: (trip: Trip) => void;
  readonly onSubscriptions: () => void;
};

// «Mening safarlarim» of a driver (G64, docs/118 path 7, mockup g64/6): «Faol» is the week with its
// dots, «Ertaga shu safar», the live trips with their marks and the month; «Oʻtgan» the past trips.
// Back from a trip the list stands at the same place (docs/94 F2, S3).
export function MyTripsList(props: Props) {
  const { trips, booked, waiting, offers, tab, onTab, onBack, onRefresh, onTrip, onOffer } = props;
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const [now] = useState(Date.now);
  const [picked, setPicked] = useState<string | null>(null);
  useListPlace(MY_TRIPS, true);
  useKeepPlace(trips);
  if (trips.length === 0 && offers.length === 0) {
    return (
      <>
        <Screen onBack={onBack} onRefresh={onRefresh} />
        <EmptyState
          icon="myTrips"
          title={t('market.mine.empty')}
          description={t('market.mine.emptyHint')}
          action={
            <Button size="m" mode="bezeled" onClick={props.onSubscriptions}>
              {t('subscriptions.title')}
            </Button>
          }
        />
      </>
    );
  }
  const live = trips.filter((trip) => isLive(trip, now)).sort(byTime);
  const shown = picked ? live.filter((trip) => tashkentDate(trip.departAt) === picked) : live;
  const again = tripToRepeat(trips, now);
  const sent = offers.filter((offer) => offer.status === 'sent');
  return (
    <div className="market market-mine driver-trips" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <MineTabs tab={tab} live={live.length} onTab={onTab} />
      {tab === 'past' ? (
        <List>
          <Paged
            memory={`${MY_TRIPS}:past`}
            items={trips.filter((trip) => !isLive(trip, now))}
            render={(trip) => (
              <div key={trip.id} data-row={trip.id}>
                <TripCard trip={trip} own requests={waiting(trip)} onOpen={() => onTrip(trip)}>
                  <PastTripTags
                    trip={trip}
                    bookings={booked.filter((booking) => booking.trip.id === trip.id)}
                    now={now}
                  />
                </TripCard>
              </div>
            )}
          />
          <SentOffers offers={offers.filter((offer) => offer.status !== 'sent')} onOpen={onOffer} />
          <SubscriptionsEntry onOpen={props.onSubscriptions} />
        </List>
      ) : (
        <>
          <WeekRow
            week={weekOf(now)}
            marked={new Set(live.map((trip) => tashkentDate(trip.departAt)))}
            picked={picked}
            onPick={setPicked}
          />
          {again ? <AgainCard trip={again} onOpen={() => props.onAgain(again)} /> : null}
          {shown.map((trip) => (
            <div key={trip.id} data-row={trip.id}>
              <DriverTripRow
                trip={trip}
                requests={waiting(trip)}
                wayBack={isWayBack(trip, trips)}
                onOpen={() => onTrip(trip)}
              />
            </div>
          ))}
          {sent.length > 0 ? (
            <List>
              <SentOffers offers={sent} onOpen={onOffer} />
            </List>
          ) : null}
          <MonthTotal />
        </>
      )}
    </div>
  );
}
