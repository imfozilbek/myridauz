import type { Offer, Trip } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { SentOffers } from '../bookings/sent-offers';
import { List } from '../components';
import { useI18n } from '../context/i18n-context';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { Paged } from './paged';
import { TripCard } from './trip-card';

// The memory of the driver's «Mening safarlarim»: data, pages and place (docs/94 F2).
export const MY_TRIPS = 'market.mine.trips';

type Props = {
  readonly trips: readonly Trip[];
  readonly offers: readonly Offer[];
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
  readonly onTrip: (trip: Trip) => void;
  readonly onOffer: (offer: Offer) => void;
  readonly onSubscriptions: () => void;
};

// The list itself: back from a trip it stands at the same page and place; a quiet refresh keeps
// the trip under the finger (docs/94 F2, S3).
export function MyTripsList({ trips, offers, onBack, onRefresh, onTrip, onOffer, onSubscriptions }: Props) {
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
              <TripCard trip={trip} own onOpen={() => onTrip(trip)} />
            </div>
          )}
        />
        <SubscriptionsEntry onOpen={onSubscriptions} />
      </List>
    </div>
  );
}
