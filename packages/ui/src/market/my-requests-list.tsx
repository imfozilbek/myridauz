import type { Booking, Offer, RideRequest } from '@platform/contracts';
import { Button, Caption, Title } from '@telegram-apps/telegram-ui';
import { BookingCard } from '../bookings/booking-card';
import { PastBookingRow } from '../bookings/past-booking-row';
import { FavoritesEntry } from '../comfort/comfort-entries';
import { List, SegmentedControl } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { brandVars } from '../theme/brand-vars';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { Paged } from './paged';
import { RequestCard } from './request-card';

// The memory of the passenger's «Mening safarlarim»: data, pages and place (docs/94 F2).
export const MY_REQUESTS = 'market.mine.requests';
// «Faol» and «Oʻtgan» (owner decision 06.10.2026, docs/129, mockup g60/6).
export type MineTab = 'live' | 'past';
const isLive = (booking: Booking) => booking.status === 'requested' || booking.status === 'confirmed';

type Props = {
  readonly lists: readonly [readonly Booking[], readonly RideRequest[], readonly Offer[]];
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
  readonly onBooking: (booking: Booking) => void;
  readonly onRequest: (request: RideRequest) => void;
  readonly onSubscriptions: () => void;
  readonly onFavorites: () => void;
  readonly tab: MineTab;
  readonly onTab: (tab: MineTab) => void;
};

// The list itself: back from a booking or a request it stands at the same pages and place; a quiet
// refresh keeps the card under the finger (docs/94 F2, S3).
export function MyRequestsList(props: Props) {
  const { lists, onBack, onRefresh, onBooking, onRequest, tab, onTab, ...entries } = props;
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  useListPlace(MY_REQUESTS, true);
  useKeepPlace(lists);
  const [all, requests, offers] = lists;
  const booked = all.filter(isLive);
  const past = all.filter((booking) => !isLive(booking));
  if (all.length === 0 && requests.length === 0) {
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
    <div className="market market-mine" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <div className="market-tabs">
        <SegmentedControl>
          <SegmentedControl.Item
            selected={tab === 'live'}
            className={tab === 'live' ? 'market-tab-on' : undefined}
            onClick={() => onTab('live')}
          >
            {t('bookings.tab.live', { count: booked.length + requests.length })}
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={tab === 'past'}
            className={tab === 'past' ? 'market-tab-on' : undefined}
            onClick={() => onTab('past')}
          >
            {t('bookings.tab.past')}
          </SegmentedControl.Item>
        </SegmentedControl>
      </div>
      <List>
        {tab === 'past' ? (
          <Paged
            memory={`${MY_REQUESTS}:past`}
            items={past}
            render={(booking) => (
              <div key={booking.id} data-row={`booking:${booking.id}`}>
                <PastBookingRow booking={booking} onOpen={() => onBooking(booking)} />
              </div>
            )}
          />
        ) : (
          <>
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
            {requests.length > 0 ? (
              <Caption className="market-group">{t('market.mine.requests')}</Caption>
            ) : null}
            <Paged
              memory={`${MY_REQUESTS}:requests`}
              items={requests}
              render={(request) => (
                <div key={request.id} data-row={`request:${request.id}`}>
                  <RequestCard
                    request={request}
                    own
                    offers={sent(request)}
                    onOpen={() => onRequest(request)}
                  />
                </div>
              )}
            />
          </>
        )}
        {/* «Oʻtgan» shows the past trips only (mockup g60/6). */}
        {tab === 'past' ? null : (
          <>
            <SubscriptionsEntry onOpen={entries.onSubscriptions} />
            <FavoritesEntry onOpen={entries.onFavorites} />
          </>
        )}
      </List>
    </div>
  );
}
