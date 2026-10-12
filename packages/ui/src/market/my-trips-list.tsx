import { tashkentDate, type Booking, type Offer, type Trip } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { SentOffers } from '../bookings/sent-offers';
import { List } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { AgainCard } from '../driver-trips/again-card';
import { LiveTripRow } from '../driver-trips/live-trip-row';
import { NoTripsRow } from '../driver-trips/no-trips-row';
import { PastTripRow } from '../driver-trips/past-trip-row';
import { MonthTotal } from '../driver-trips/month-total';
import { weekOf } from '../days/week';
import { WeekRow } from '../days/week-row';
import { isLive, isWayBack, tripToRepeat } from '../driver-trips/trip-week';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { MainButton } from '../telegram/bottom-button';
import { brandVars } from '../theme/brand-vars';
import { MineTabs, type MineTab } from './mine-tabs';
import { Paged } from './paged';

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
  // A new trip from the empty list (G78 sheet 3).
  readonly onPublish: () => void;
};

// «Mening safarlarim» of a driver (G64, docs/118 path 7, mockup g64/6): «Faol» is the week with its
// dots, «Ertaga shu safar», the live trips with their marks and the month; «Oʻtgan» the past trips
// in the same rows (G78 sheet 3). Back from a trip the list stands at the same place (docs/94 F2, S3).
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
        <EmptyState icon="myTrips" title={t('market.mine.empty')} description={t('market.mine.emptyHint')} />
        <MainButton text={t('home.publish')} onClick={props.onPublish} />
      </>
    );
  }
  const live = trips.filter((trip) => isLive(trip, now)).sort(byTime);
  const liveDays = new Set(live.map((trip) => tashkentDate(trip.departAt)));
  const today = tashkentDate(now);
  const shown = picked ? live.filter((trip) => tashkentDate(trip.departAt) === picked) : live;
  const again = tripToRepeat(trips, now);
  const sent = offers.filter((offer) => offer.status === 'sent');
  const past = trips.filter((trip) => !isLive(trip, now));
  return (
    <div className="market market-mine driver-trips" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <MineTabs tab={tab} live={live.length} onTab={onTab} />
      {tab === 'past' ? (
        <List>
          {past.length === 0 ? <NoTripsRow text={t('market.mine.noPast')} inList /> : null}
          <Paged
            memory={`${MY_TRIPS}:past`}
            items={past}
            render={(trip) => (
              <div key={trip.id} data-row={trip.id}>
                <PastTripRow
                  trip={trip}
                  bookings={booked.filter((booking) => booking.trip.id === trip.id)}
                  now={now}
                  onOpen={() => onTrip(trip)}
                />
              </div>
            )}
          />
          <SentOffers offers={offers.filter((offer) => offer.status !== 'sent')} onOpen={onOffer} />
          <SubscriptionsEntry onOpen={props.onSubscriptions} />
        </List>
      ) : (
        <>
          <WeekRow
            days={weekOf(now).map((date) => ({ date, marked: liveDays.has(date) }))}
            on={picked ?? today}
            onPick={(date) => setPicked(date === picked ? null : date)}
          />
          {shown.length === 0 ? <NoTripsRow text={t('market.mine.noLive')} /> : null}
          {again ? <AgainCard trip={again} onOpen={() => props.onAgain(again)} /> : null}
          {shown.map((trip) => (
            <div key={trip.id} data-row={trip.id}>
              <LiveTripRow
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
