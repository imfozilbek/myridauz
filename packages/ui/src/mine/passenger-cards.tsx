import { tashkentDate, type Booking, type RideRequest } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useCardDay } from '../market/when';
import { MineCard } from './mine-card';
import { useWay } from './use-way';

type BookingProps = { readonly booking: Booking; readonly onOpen: () => void };

// A seat: «Ertaga · 08:00», the way, the driver and the car, «Joy tasdiqlandi» (mockup g75/2 A).
export function BookingMineCard({ booking, onOpen }: BookingProps) {
  const { t, formatTime } = useI18n();
  const day = useCardDay();
  const way = useWay();
  const { trip } = booking;
  const { car } = trip.driver;
  const confirmed = booking.status === 'confirmed';
  return (
    <MineCard
      head={t('market.mine.when', {
        day: day(tashkentDate(trip.departAt), Date.now()),
        time: formatTime(new Date(trip.departAt)),
      })}
      route={way(trip.from, trip.to)}
      meta={
        <>
          <span>{trip.driver.firstName}</span>
          {t('market.mine.car', {
            model: car.model,
            // Mid line the color is a small letter: «Cobalt, oq» (mockup g75/2 A).
            color: t(`drivers.color.${car.color}`).toLocaleLowerCase(),
          })}
        </>
      }
      chip={{
        text: t(confirmed ? 'bookings.confirmed.title' : `bookings.status.${booking.status}`),
        tone: confirmed ? 'good' : 'gray',
      }}
      onOpen={onOpen}
    />
  );
}

type RequestProps = {
  readonly request: RideRequest;
  readonly offers: number;
  readonly onOpen: () => void;
  // «Qayta yuborish» of a request whose day is over (G75, docs/158 Е).
  readonly onAgain: () => void;
};

// A request: «12-okt · Soʻrov», the way, how many people; the offers or «Muddati oʻtdi» with
// «Qayta yuborish» (mockup g75/2 A).
export function RequestMineCard({ request, offers, onOpen, onAgain }: RequestProps) {
  const { t } = useI18n();
  const day = useCardDay();
  const way = useWay();
  const expired = request.status === 'expired';
  const chip = expired
    ? { text: t('market.mine.expired'), tone: 'gray' as const }
    : offers > 0
      ? { text: t('market.request.offers', { count: String(offers) }), tone: 'brand' as const }
      : null;
  const again = (
    <button
      type="button"
      className="mine-card-link"
      onClick={(event) => {
        event.stopPropagation();
        onAgain();
      }}
    >
      {t('market.mine.again')}
    </button>
  );
  return (
    <MineCard
      head={t('market.mine.requestDay', { day: day(request.date, Date.now()) })}
      route={way(request.from, request.to)}
      meta={t('market.request.seats', { count: String(request.seats) })}
      chip={chip}
      {...(expired ? { link: again } : {})}
      onOpen={onOpen}
    />
  );
}
