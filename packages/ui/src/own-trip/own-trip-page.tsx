import type { Booking, Offer, Trip } from '@platform/contracts';
import type { ReactNode } from 'react';
import { requestsByTime } from '../bookings/trip-bookings-order';
import { short } from '../bookings/use-balance';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { NoShowBanners } from '../meeting/no-show-banners';
import { NoShowLine } from '../meeting/no-show-line';
import { refundWaits } from '../meeting/no-show-text';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { OwnTripCard } from '../trip/own-trip-card';
import { taken } from '../trip-end/trip-sums';
import { OwnTripBanner } from './own-trip-banner';
import { OwnTripTiles, type OwnTripTile } from './own-trip-tiles';
import { PrivateTripBanner } from './private-trip-banner';
import { RiderRow } from './rider-row';
import { SeatRequestCard } from './seat-request-card';
import { TripMainButton } from './trip-main-button';
import { TripPublicity } from './trip-publicity';
import { tripStep, type TripStage, type TripStep } from './trip-stage';
import type { RiderScreen } from './own-trip-opened';
import './own-trip.css';
import './own-trip-people.css';

type Props = {
  readonly trip: Trip;
  readonly stage: TripStage;
  // The time the page shows: it moves on by itself (useNow).
  readonly now: number;
  // The bookings of this trip.
  readonly bookings: readonly Booking[];
  // The wallet of the driver; null until it comes (docs/65 C).
  readonly balance: number | null;
  readonly onBack: () => void;
  readonly onAnswer: (booking: Booking, action: 'confirm' | 'decline') => unknown;
  readonly onOpen: (booking: Booking, screen: RiderScreen) => void;
  readonly onTile: (tile: OwnTripTile) => void;
  readonly onCancel: () => unknown;
  // «Yoʻlga chiqdim» and «Yetib keldik» on the server (G63 B1): the main button.
  readonly onStep: (step: TripStep) => unknown;
  // «Kelmadi» of a passenger at the meeting, asked first (useMeetMark, docs/129).
  readonly onMark: (booking: Booking) => void;
  // A private trip (G64): its offer and «Safarni hammaga ochish».
  readonly offer: Offer | null;
  readonly onOpened: () => unknown;
  // The failure of an action and the note of a tile, under the tiles.
  readonly children?: ReactNode;
};

// «Mening safarim» of a driver (owner decision 06.10.2026, docs/118 path 6, mockup g63/3 A with the
// main button of C; journey g63/4 screens 6 and 11): the plate of the stage, the requests by their
// time answered in their cards, the passengers with the chat and the call, the trip, four tiles; the
// cancel only before the departure. The meeting opens from a point of «Yoʻl xaritasi» (screen 12).
export function OwnTripPage(props: Props) {
  const { trip, stage, now, bookings, balance, onBack, onAnswer, onOpen, onTile, onCancel, onStep } = props;
  const { onMark, offer, onOpened, children } = props;
  useScreenView('market.own_trip');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const step = tripStep(trip, now);
  const requested = requestsByTime(bookings.filter((booking) => booking.status === 'requested'));
  const riders = bookings.filter(taken);
  const seats = riders.reduce((sum, booking) => sum + booking.seats, 0);
  // Before the departure: people still look for the trip and the driver may cancel it (docs/35).
  const notLeft = stage === 'published' || stage === 'soon';
  // A private trip is the plate, the trip and the cancel until the answer (mockup g64/3 phone 3).
  const open = !trip.private;
  return (
    <div className="own-trip" style={brandVars(colors)} data-button={step ? '' : undefined}>
      <Screen onBack={onBack} />
      {/* After «Kelmadi» its plate stands where the plate of the stage was (mockup g63/5 phone 1). */}
      {!open ? (
        <PrivateTripBanner trip={trip} offer={offer} onOpened={onOpened} />
      ) : bookings.some(refundWaits) ? (
        <NoShowBanners bookings={bookings} />
      ) : (
        <OwnTripBanner trip={trip} stage={stage} riders={seats} now={now} />
      )}
      {/* While people look for the trip (owner decision 08.10.2026, docs/119). */}
      {notLeft && open ? <TripPublicity trip={trip} /> : null}
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
      {open && (riders.length > 0 || requested.length === 0) ? (
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
                line={(usual) => (
                  <NoShowLine booking={booking} now={now} onMark={() => onMark(booking)}>
                    {usual}
                  </NoShowLine>
                )}
              />
            ))}
          </div>
        </>
      ) : null}
      <h2 className="own-head">{t('driverTrip.trip')}</h2>
      <OwnTripCard trip={trip} />
      {open ? <OwnTripTiles onTile={onTile} /> : null}
      {children}
      <div className="own-links">
        {notLeft ? (
          <button type="button" className="own-cancel" onClick={() => void onCancel()}>
            {t('market.trip.cancel')}
          </button>
        ) : null}
      </div>
      {step ? <TripMainButton step={step} onPress={onStep} /> : null}
    </div>
  );
}
