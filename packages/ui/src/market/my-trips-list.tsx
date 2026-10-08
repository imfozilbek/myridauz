import type { Booking, Offer, Trip } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { SentOffers } from '../bookings/sent-offers';
import { List } from '../components';
import { useI18n } from '../context/i18n-context';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { PastTripTags } from '../trip-end/past-trip-tags';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { Paged } from './paged';
import { TripCard } from './trip-card';

// The memory of the driver's «Mening safarlarim»: data, pages and place (docs/94 F2).
export const MY_TRIPS = 'market.mine.trips';

type Props = {
  readonly trips: readonly Trip[];
  // The bookings of the driver: a past trip says what is left on its card (G63, docs/129).
  readonly booked: readonly Booking[];
  // How many new requests wait for the driver's answer on each trip (G41, docs/90 F-D4).
  readonly waiting: (trip: Trip) => number;
  readonly offers: readonly Offer[];
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
  readonly onTrip: (trip: Trip) => void;
  readonly onOffer: (offer: Offer) => void;
  readonly onSubscriptions: () => void;
};

// The list itself: back from a trip it stands at the same page and place; a quiet refresh keeps
// the trip under the finger (docs/94 F2, S3).
export function MyTripsList({
  trips,
  booked,
  waiting,
  offers,
  onBack,
  onRefresh,
  onTrip,
  onOffer,
  onSubscriptions,
}: Props) {
  const { t } = useI18n();
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
            <Button size="m" mode="bezeled" onClick={onSubscriptions}>
              {t('subscriptions.title')}
            </Button>
          }
        />
      </>
    );
  }
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <List>
        <SentOffers offers={offers} onOpen={onOffer} />
        <Paged
          memory={MY_TRIPS}
          items={trips}
          render={(trip) => (
            <div key={trip.id} data-row={trip.id}>
              <TripCard trip={trip} own requests={waiting(trip)} onOpen={() => onTrip(trip)}>
                <PastTripTags
                  trip={trip}
                  bookings={booked.filter((booking) => booking.trip.id === trip.id)}
                  now={Date.now()}
                />
              </TripCard>
            </div>
          )}
        />
        <SubscriptionsEntry onOpen={onSubscriptions} />
      </List>
    </div>
  );
}
