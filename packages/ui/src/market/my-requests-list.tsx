import type { Booking, Offer, RideRequest } from '@platform/contracts';
import { Button, Caption, Title } from '@telegram-apps/telegram-ui';
import { BookingCard } from '../bookings/booking-card';
import { FavoritesEntry } from '../comfort/comfort-entries';
import { List } from '../components';
import { useI18n } from '../context/i18n-context';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { Paged } from './paged';
import { RequestCard } from './request-card';

// The memory of the passenger's «Mening safarlarim»: data, pages and place (docs/94 F2).
export const MY_REQUESTS = 'market.mine.requests';

type Props = {
  readonly lists: readonly [readonly Booking[], readonly RideRequest[], readonly Offer[]];
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
  readonly onBooking: (booking: Booking) => void;
  readonly onRequest: (request: RideRequest) => void;
  readonly onSubscriptions: () => void;
  readonly onFavorites: () => void;
};

// The list itself: back from a booking or a request it stands at the same pages and place; a quiet
// refresh keeps the card under the finger (docs/94 F2, S3).
export function MyRequestsList({ lists, onBack, onRefresh, onBooking, onRequest, ...entries }: Props) {
  const { t } = useI18n();
  useListPlace(MY_REQUESTS, true);
  useKeepPlace(lists);
  const [booked, requests, offers] = lists;
  if (booked.length === 0 && requests.length === 0) {
    return (
      <>
        <Screen onBack={onBack} onRefresh={onRefresh} />
        <EmptyState
          icon="myTrips"
          title={t('market.mine.requestsEmpty')}
          description={t('market.mine.requestsEmptyHint')}
          action={
            <Button size="m" mode="bezeled" onClick={entries.onSubscriptions}>
              {t('subscriptions.title')}
            </Button>
          }
        />
        <List>
          <FavoritesEntry onOpen={entries.onFavorites} />
        </List>
      </>
    );
  }
  const sent = (request: RideRequest) =>
    offers.filter((item) => item.requestId === request.id && item.status === 'sent').length;
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <List>
        {booked.length > 0 ? <Caption className="market-group">{t('bookings.mine')}</Caption> : null}
        <Paged
          memory={`${MY_REQUESTS}:booked`}
          items={booked}
          render={(booking) => (
            <div key={booking.id} data-row={`booking:${booking.id}`}>
              <BookingCard booking={booking} side="passenger" onOpen={() => onBooking(booking)} />
            </div>
          )}
        />
        {requests.length > 0 ? <Caption className="market-group">{t('market.mine.requests')}</Caption> : null}
        <Paged
          memory={`${MY_REQUESTS}:requests`}
          items={requests}
          render={(request) => (
            <div key={request.id} data-row={`request:${request.id}`}>
              <RequestCard request={request} own offers={sent(request)} onOpen={() => onRequest(request)} />
            </div>
          )}
        />
        <SubscriptionsEntry onOpen={entries.onSubscriptions} />
        <FavoritesEntry onOpen={entries.onFavorites} />
      </List>
    </div>
  );
}
