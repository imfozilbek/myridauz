import { ApiError } from '@platform/api-client';
import { commissionFor } from '@platform/brands';
import type { RequestBoardQuery, RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { DayCounts } from '../find/day-counts';
import { RouteScreen, type Route } from '../places/route-screen';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { BoardList } from './board-list';
import { BoardTrip } from './board-trip';
import { OfferSheet } from './offer-sheet';
import type { RowAction } from './request-row';
import { SalonSheet } from './salon-sheet';
import { useBoard } from './use-board';
import './board.css';

type Props = {
  readonly query: RequestBoardQuery;
  readonly onDay: (date: string) => void;
  // No direction yet (no trips, no subscriptions): the route is asked first.
  readonly onRoute: (route: Route) => void;
  readonly onTalk: (chatKey: string, ring: boolean) => void;
  readonly onShort: (commission: number) => void;
  readonly onTrip: (tripId: string) => void;
  readonly onPublish: (date: string) => void;
  readonly onBack: () => void;
};

// «Yoʻlovchilar soʻrovlari» (G64, docs/118 path 7, mockups g64/1 … g64/3): the requests on the
// driver's directions by day; with a live trip, the ones that fit it on top. One logic everywhere:
// the driver offers, the passenger answers (docs/35).
export function BoardScreen({ query, onDay, onRoute, onTalk, onShort, onTrip, onPublish, onBack }: Props) {
  useScreenView('requests.board');
  useScreenBackground();
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { colors } = useBrand().theme;
  const { commission } = useBrand();
  const { bookings } = useApiClients();
  const { value, failed, reload, refresh } = useBoard(query);
  const [offer, setOffer] = useState<RideRequest | null>(null);
  const [salon, setSalon] = useState<RideRequest | null>(null);
  const { failure, fail, clear } = useFailure();
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const { board, offered } = value;
  if (!board.known) return <RouteScreen allowWholeRegion quick onBack={onBack} onDone={onRoute} />;
  const { trip } = board;
  // «Safarimga taklif qilish»: one tap, the time and the price are the trip's (mockup g64/2).
  const onTripOffer = async (request: RideRequest) => {
    if (!trip) return;
    clear();
    try {
      await bookings.sendOffer(request.id, { departAt: trip.departAt, price: trip.price, tripId: trip.id });
      track({ name: 'booking_step', screen: 'requests.board', step: 'offer_sent' });
      haptic.success();
      void refresh();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough')
        onShort(commissionFor(commission, trip.price, request.seats));
      else fail(caught);
    }
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
    }
  };
  const short = (fee: number) => {
    setOffer(null);
    setSalon(null);
    onShort(fee);
  };
  const empty = board.fits.length + board.others.length === 0;
  return (
    <div className="board" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={refresh} />
      <h1 className="board-title">{t('common.driver.passengerRequests')}</h1>
      {trip ? (
        <BoardTrip trip={trip} onOpen={() => onTrip(trip.id)} />
      ) : (
        <DayCounts days={board.days} date={board.date} onDay={onDay} />
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
          {...(trip ? {} : { description: t('market.requests.emptyHint') })}
        />
      ) : null}
      {empty && !trip ? (
        <MainButton text={t('market.requests.publish')} onClick={() => onPublish(board.date)} />
      ) : null}
      <OfferSheet
        request={offer}
        onClose={() => setOffer(null)}
        onSent={() => {
          setOffer(null);
          void refresh();
        }}
        onShort={short}
      />
      <SalonSheet
        request={salon}
        seats={board.carSeats}
        onClose={() => setSalon(null)}
        onOpened={onTrip}
        onShort={short}
      />
    </div>
  );
}
