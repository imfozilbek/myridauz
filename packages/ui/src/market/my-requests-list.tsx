import type { Booking, Offer, RideRequest } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { PastBookingRow } from '../bookings/past-booking-row';
import { FavoritesEntry } from '../comfort/comfort-entries';
import { List } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { BookingMineCard, RequestMineCard } from '../mine/passenger-cards';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { brandVars } from '../theme/brand-vars';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { MainButton } from '../telegram/bottom-button';
import { MineTabs, type MineTab } from './mine-tabs';
import { Paged } from './paged';
import '../mine/mine-page.css';

// The memory of the passenger's «Mening safarlarim»: data, pages and place (docs/94 F2).
export const MY_REQUESTS = 'market.mine.requests';
const isLive = (booking: Booking) => booking.status === 'requested' || booking.status === 'confirmed';
// An open request waits for offers; one whose day is over stays with «Qayta yuborish» (mockup g75/2 A).
const shownRequest = (request: RideRequest) => request.status === 'open' || request.status === 'expired';

type Props = {
  readonly lists: readonly [readonly Booking[], readonly RideRequest[], readonly Offer[]];
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
  readonly onBooking: (booking: Booking) => void;
  readonly onRequest: (request: RideRequest) => void;
  readonly onAgain: (request: RideRequest) => void;
  readonly onFind: () => void;
  readonly onSubscriptions: () => void;
  readonly onFavorites: () => void;
  readonly tab: MineTab;
  readonly onTab: (tab: MineTab) => void;
};

// «Mening safarlarim» of a passenger (G75, mockup g75/2 A): «Faol» is a card for each seat and request,
// «Oʻtgan» the past seats; nothing live: one action, «Safar topish». Back from a seat or a request the
// list stands at the same place (docs/94 F2, S3).
export function MyRequestsList(props: Props) {
  const { lists, onBack, onRefresh, onBooking, onRequest, onAgain, tab, onTab } = props;
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  useListPlace(MY_REQUESTS, true);
  useKeepPlace(lists);
  const [all, requests, offers] = lists;
  const booked = all.filter(isLive);
  const past = all.filter((booking) => !isLive(booking));
  const asked = requests.filter(shownRequest);
  const sent = (request: RideRequest) =>
    offers.filter((item) => item.requestId === request.id && item.status === 'sent').length;
  const live = booked.length + asked.length;
  return (
    <div className="market market-mine mine-page" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <MineTabs tab={tab} live={live} onTab={onTab} />
      {tab === 'past' ? (
        <List>
          {past.length === 0 && <EmptyState top icon="myTrips" title={t('market.mine.noPast')} />}
          <Paged
            memory={`${MY_REQUESTS}:past`}
            items={past}
            render={(booking) => (
              <div key={booking.id} data-row={`booking:${booking.id}`}>
                <PastBookingRow booking={booking} onOpen={() => onBooking(booking)} />
              </div>
            )}
          />
          {/* As on «Mening safarlarim» of a driver (g64/6): the followed routes and the saved drivers
              under the past trips; «Faol» keeps only what goes (mockup g75/2 A). */}
          <SubscriptionsEntry onOpen={props.onSubscriptions} />
          <FavoritesEntry onOpen={props.onFavorites} />
        </List>
      ) : live === 0 ? (
        <>
          <EmptyState
            top
            icon="myTrips"
            title={t('market.mine.noLive')}
            description={t('market.mine.requestsEmptyHint')}
          />
          <MainButton text={t('common.passenger.findTrip')} onClick={props.onFind} />
        </>
      ) : (
        <>
          <Paged
            memory={`${MY_REQUESTS}:booked`}
            items={booked}
            render={(booking) => (
              <div key={booking.id} data-row={`booking:${booking.id}`}>
                <BookingMineCard booking={booking} onOpen={() => onBooking(booking)} />
              </div>
            )}
          />
          <Paged
            memory={`${MY_REQUESTS}:requests`}
            items={asked}
            render={(request) => (
              <div key={request.id} data-row={`request:${request.id}`}>
                <RequestMineCard
                  request={request}
                  offers={sent(request)}
                  onOpen={() => onRequest(request)}
                  onAgain={() => onAgain(request)}
                />
              </div>
            )}
          />
        </>
      )}
    </div>
  );
}
