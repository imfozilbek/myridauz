import type { Booking, Trip } from '@platform/contracts';
import type { ReactNode } from 'react';
import { requestsInOrder } from '../bookings/trip-bookings-order';
import { short } from '../bookings/use-balance';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { OwnTripCard } from '../trip/own-trip-card';
import { OwnTripBanner } from './own-trip-banner';
import { OwnTripTiles, type OwnTripTile } from './own-trip-tiles';
import { RiderRow } from './rider-row';
import { SeatRequestCard } from './seat-request-card';
import { TripMainButton } from './trip-main-button';
import { tripStage, type TripStep } from './trip-stage';
import type { RiderScreen } from './own-trip-opened';
import { useNow } from './use-now';
import './own-trip.css';
import './own-trip-people.css';

type Props = {
  readonly trip: Trip;
  // The bookings of this trip.
  readonly bookings: readonly Booking[];
  // The wallet of the driver; null until it comes (docs/65 C).
  readonly balance: number | null;
  readonly onBack: () => void;
  readonly onAnswer: (booking: Booking, action: 'confirm' | 'decline') => unknown;
  readonly onOpen: (booking: Booking, screen: RiderScreen) => void;
  readonly onTile: (tile: OwnTripTile) => void;
  readonly onCancel: () => unknown;
  // «Yoʻlga chiqdim» and «Yetib keldik» on the server (G63 B1): the main button shows with it.
  readonly onStep?: ((step: TripStep) => unknown) | undefined;
  // The failure of an action and the note of a tile, under the tiles.
  readonly children?: ReactNode;
};

const riding = (booking: Booking) => booking.status === 'confirmed' || booking.status === 'completed';

// «Mening safarim» of a driver (owner decision 06.10.2026, docs/118 path 6, mockup g63/3 A with the
// main button of C): the plate of the stage, the requests answered in their cards, the passengers
// with the chat and the call, the trip, four tiles; the cancel only before the departure.
export function OwnTripPage(props: Props) {
  const { trip, bookings, balance, onBack, onAnswer, onOpen, onTile, onCancel, onStep, children } = props;
  useScreenView('market.own_trip');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const now = useNow();
  const stage = tripStage(trip, now);
  const requested = requestsInOrder(bookings.filter((booking) => booking.status === 'requested'));
  const riders = bookings.filter(riding);
  const seats = riders.reduce((sum, booking) => sum + booking.seats, 0);
  return (
    <div className="own-trip" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <OwnTripBanner trip={trip} stage={stage} riders={seats} now={now} />
      {requested.length > 0 ? (
        <>
          <h2 className="own-head">{t('driverTrip.asked', { count: String(requested.length) })}</h2>
          {requested.map((booking) => (
            <SeatRequestCard
              key={booking.id}
              booking={booking}
              short={short(balance, booking.commission)}
              onAnswer={(action) => onAnswer(booking, action)}
              onTopUp={() => onOpen(booking, 'not_enough')}
              onOpen={() => onOpen(booking, 'booking')}
            />
          ))}
        </>
      ) : null}
      {riders.length > 0 || requested.length === 0 ? (
        <>
          <h2 className="own-head">{t('driverTrip.passengers', { count: String(seats) })}</h2>
          <div className="own-riders">
            {riders.length === 0 ? <p className="own-empty">{t('bookings.none')}</p> : null}
            {riders.map((booking) => (
              <RiderRow
                key={booking.id}
                booking={booking}
                onChat={() => onOpen(booking, 'chat')}
                onCall={() => onOpen(booking, 'call')}
                onOpen={() => onOpen(booking, 'booking')}
              />
            ))}
          </div>
        </>
      ) : null}
      <h2 className="own-head">{t('driverTrip.trip')}</h2>
      <OwnTripCard trip={trip} />
      <OwnTripTiles onTile={onTile} />
      {children}
      <div className="own-links">
        {stage === 'published' || stage === 'soon' ? (
          <button type="button" className="own-cancel" onClick={() => void onCancel()}>
            {t('market.trip.cancel')}
          </button>
        ) : null}
      </div>
      {onStep ? <TripMainButton stage={stage} onPress={onStep} /> : null}
    </div>
  );
}
