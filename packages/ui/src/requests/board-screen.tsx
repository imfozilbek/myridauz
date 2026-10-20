import type { RequestBoardQuery, RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { isStale } from '../market/error-text';
import { useI18n } from '../context/i18n-context';
import { countedWeek } from '../days/week';
import { WeekRow } from '../days/week-row';
import { RouteScreen, type Route } from '../places/route-screen';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { NotifyMe } from '../subscriptions/notify-me';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { BoardList } from './board-list';
import { BoardTrip } from './board-trip';
import { OfferSheet } from './offer-sheet';
import type { RowAction } from './request-row';
import { SalonSheet } from './salon-sheet';
import { useBoard } from './use-board';
import { useTripOffer } from './use-trip-offer';
import { ShortfallSheet } from '../wallet/shortfall-sheet';
import './board.css';

type Props = {
  readonly query: RequestBoardQuery;
  readonly onDay: (date: string) => void;
  // No direction yet (no trips, no subscriptions): the route is asked first.
  readonly onRoute: (route: Route) => void;
  readonly onTalk: (chatKey: string, ring: boolean) => void;
  readonly onTrip: (tripId: string) => void;
  readonly onPublish: (date: string) => void;
  readonly onBack: () => void;
};

// «Yoʻlovchilar soʻrovlari» (G64, docs/118 path 7, mockups g64/1 … g64/3): the requests on the
// driver's directions by day; with a live trip, the ones that fit it on top. One logic everywhere:
// the driver offers, the passenger answers (docs/35).
export function BoardScreen({ query, onDay, onRoute, onTalk, onTrip, onPublish, onBack }: Props) {
  useScreenView('requests.board');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const { bookings } = useApiClients();
  const { value, failed, reload, refresh } = useBoard(query);
  const [offer, setOffer] = useState<RideRequest | null>(null);
  const [salon, setSalon] = useState<RideRequest | null>(null);
  const offering = useTripOffer('requests.board');
  const { failure, fail, clear } = offering;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const { board, offered } = value;
  if (!board.known) return <RouteScreen allowWholeRegion quick onBack={onBack} onDone={onRoute} />;
  const { trip } = board;
  // «Safarimga taklif qilish»: one tap, the time and the price are the trip's (mockup g64/2).
  // The board loads again after an offer, sent or refused: a closed request leaves it (G89 U7).
  const onTripOffer = async (request: RideRequest) => {
    if (!trip) return;
    await offering.onTrip(request, trip);
    void refresh();
  };
  const act = (request: RideRequest, action: RowAction) => {
    if (action === 'onTrip') return onTripOffer(request);
    clear();
    return action === 'salon' ? setSalon(request) : setOffer(request);
  };
  const talk = async (request: RideRequest, ring: boolean) => {
    clear();
    try {
      onTalk(await bookings.openTalk(request.id), ring);
    } catch (caught) {
      fail(caught);
      if (isStale(caught)) void refresh();
    }
  };
  // No money for the commission: the sheet of the sum short over the board (G75, mockup g75/4 B).
  function short(need: number, request: RideRequest | null) {
    setOffer(null);
    setSalon(null);
    if (request) offering.short(need, request);
  }
  const empty = board.fits.length + board.others.length === 0;
  // A live trip, shown or not: no new trip is asked for (one at a time, docs/172).
  const free = !trip && !board.busy;
  return (
    <div className="board" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={refresh} />
      <h1 className="board-title">{t('common.driver.passengerRequests')}</h1>
      {trip ? (
        <BoardTrip trip={trip} onOpen={() => onTrip(trip.id)} />
      ) : (
        <WeekRow days={countedWeek(board.days)} on={board.date} onPick={onDay} />
      )}
      <ActionFailure error={failure} />
      <BoardList
        board={board}
        offered={offered}
        onAction={act}
        onTalk={(request, ring) => void talk(request, ring)}
      />
      {empty ? (
        <EmptyState
          icon="passengers"
          title={t('market.requests.empty')}
          {...(free ? { description: t('market.requests.emptyHint') } : {})}
          {...(board.notify
            ? { action: <NotifyMe from={board.notify.from} to={board.notify.to} date={board.date} small /> }
            : {})}
        />
      ) : null}
      {empty && free ? (
        <MainButton text={t('market.requests.publish')} onClick={() => onPublish(board.date)} />
      ) : null}
      <OfferSheet
        request={offer}
        onClose={() => setOffer(null)}
        onSent={() => {
          setOffer(null);
          void refresh();
        }}
        onShort={(need) => short(need, offer)}
        onStale={() => void refresh()}
      />
      <SalonSheet
        request={salon}
        seats={board.carSeats}
        onClose={() => setSalon(null)}
        onOpened={onTrip}
        onShort={(need) => short(need, salon)}
      />
      <ShortfallSheet shortfall={offering.shortfall} onClose={offering.closeShortfall} />
    </div>
  );
}
