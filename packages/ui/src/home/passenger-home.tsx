import { BOOKING_LINK, OFFER_LINK } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { useHere } from '../places/use-here';
import { Screen } from '../screen/screen';
import { ArrivedSheet } from './arrived-sheet';
import { HomeRowCard } from './home-card';
import { HomeFailed, HomeLoading } from './home-state';
import { HomeTrips } from './home-trips';
import { nextBookings, waitingOffers } from './home-items';
import { usePassengerData, type PassengerLoad } from './passenger-data';
import { useHomeTap } from './use-home-tap';

// The main screen of a passenger (G25): the nearest bookings and the requests with offers (G53), or
// «Qayerga borasiz?» with the start where the person stands. «Safar topish» is the main button.
export function PassengerHome({ go }: { readonly go: HomeGo }) {
  const load = usePassengerData();
  // A pull down at the top of the main screen refreshes the bookings (docs/94 W1).
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <Bookings go={go} load={load} />
      <ArrivedSheet bookings={load.value?.[0] ?? []} onTold={load.refresh} />
    </>
  );
}

type BookingsProps = { readonly go: HomeGo; readonly load: PassengerLoad };
const SHOWN = 2;

function Bookings({ go, load: { value, failed, reload } }: BookingsProps) {
  const { t } = useI18n();
  const [places, retryPlaces] = useDirectory();
  const tap = useHomeTap();
  const retry = () => {
    if (failed) reload();
    if (places.status === 'error') retryPlaces();
  };
  if (failed) return <HomeFailed onRetry={retry} />;
  if (!value) return <HomeLoading lines={[false, false]} />;
  const [all, requests, offers] = value;
  const shown = nextBookings(all);
  const waiting = waitingOffers(requests, offers);
  const asked = requests.filter((request) => waiting.some((offer) => offer.requestId === request.id));
  const directory = places.status === 'ready' ? places.directory : null;
  // «Qayerdan» and the recent routes wait for the names of the places: they come whole, the
  // actions below do not move (G41, docs/108).
  const nothing = shown.length === 0 && asked.length === 0;
  if (nothing && places.status === 'loading') return <HomeLoading lines={[false, false]} />;
  if (nothing)
    return (
      <AskWay
        directory={directory}
        onFrom={tap('card', () => go('find_trip', { pick: 'from' }))}
        onTo={tap('card', () => go('find_trip', { pick: 'to' }))}
      />
    );
  // The names of the places come from the directory: without it the rows cannot be read.
  if (places.status === 'error') return <HomeFailed onRetry={retry} />;
  if (places.status === 'loading') return <HomeLoading lines={shown.map(() => true)} />;
  const bookingRows = shown.map((booking) => ({
    id: booking.id,
    from: booking.trip.from,
    to: booking.trip.to,
    departAt: booking.trip.departAt,
    meta: t('home.driverCar', { name: booking.trip.driver.firstName, model: booking.trip.driver.car.model }),
    pill: {
      text: t(`bookings.status.${booking.status}`),
      tone: booking.status === 'confirmed' ? ('success' as const) : ('attention' as const),
    },
    ...(booking.unread ? { unread: booking.unread } : {}),
  }));
  // A request with offers opens its first offer; «Назад» shows the request with all of them.
  const firstOffer = (requestId: string) => waiting.find((offer) => offer.requestId === requestId)?.id;
  const requestRows = asked.map((request) => {
    const count = waiting.filter((offer) => offer.requestId === request.id).length;
    return {
      id: request.id,
      from: request.from,
      to: request.to,
      departAt: 0,
      day: request.date,
      meta: t('market.request.seats', { count: String(request.seats) }),
      pill: { text: t('market.request.offers', { count: String(count) }), tone: 'attention' as const },
    };
  });
  const open = (id: string) => {
    const offer = firstOffer(id);
    const link = offer ? { name: OFFER_LINK, id: offer } : { name: BOOKING_LINK, id };
    tap('item', () => go('my_trips', { link }))();
  };
  return (
    <HomeTrips
      rows={[...bookingRows, ...requestRows].slice(0, SHOWN)}
      directory={places.directory}
      onOpen={open}
    />
  );
}

// «Qayerdan» filled by the district of the person when they allowed the place before, the same
// the search list shows after the tap (G26, docs/74); «Qayerga borasiz?».
type AskProps = {
  readonly directory: PlaceDirectory | null;
  readonly onFrom: () => void;
  readonly onTo: () => void;
};

function AskWay({ directory, onFrom, onTo }: AskProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const here = useHere(directory);
  return (
    <>
      <span className="home-label">{t('places.route')}</span>
      <HomeRowCard
        icon="origin"
        color={colors.brandStrong}
        title={here?.name ?? t('way.fromEmpty')}
        {...(here ? { hint: t('way.here') } : {})}
        onClick={onFrom}
      />
      <HomeRowCard icon="destination" color={colors.accentStrong} title={t('way.toEmpty')} onClick={onTo} />
    </>
  );
}
