import {
  DAY_MS,
  REQUEST_LINK,
  TRIP_LINK,
  tashkentDayStart,
  type Offer,
  type RideRequest,
  type Trip,
} from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import { openSheet } from '../../action-sheet/action-queue';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { DockCard } from './dock-card';
import type { DockWords } from './dock-words';
import { markSeen } from './passenger-marks';

type Plan =
  | { readonly kind: 'request'; readonly request: RideRequest }
  | { readonly kind: 'offers'; readonly request: RideRequest; readonly offers: readonly Offer[] }
  | { readonly kind: 'favorite'; readonly trip: Trip };
type Props = { readonly plan: Plan; readonly words: DockWords; readonly go: HomeGo; readonly now: number };

// A request stays open to the end of its day (docs/35): the time left shows its last day.
const requestEnds = (request: RideRequest) => tashkentDayStart(request.date) + DAY_MS;

// What a passenger plans (G76, mockup g76/2 states 3, 4, 5): the trip of a saved driver once, the
// open request, the offers of drivers on it.
export function PassengerPlanCard({ plan, words, go, now }: Props) {
  const { t, formatTime, formatNumber } = useI18n();
  const findTrip = () => go('find_trip');
  if (plan.kind === 'favorite') {
    const { trip } = plan;
    const driver = trip.driver;
    const title = t('home.favorites.trip', {
      name: driver.firstName,
      when: words.when(trip.departAt).toLocaleLowerCase('uz'),
    });
    // The sums of the block go without «soʻm», as on the mockup g76/2 (decision of the owner 10.10.2026).
    const price = t('bookings.request.perSeat', { price: formatNumber(trip.price) });
    return (
      <>
        <DockCard
          chip={t('bookings.favorite.kicker')}
          title={title}
          text={`${words.route(trip)} · ${price}`}
          who={{ person: driver, sub: words.car(driver.car, null) }}
        />
        <SecondaryButton beside text={t('home.dock.otherTrip')} onClick={() => markSeen(trip.id)} />
        <MainButton
          text={t('home.dock.see')}
          onClick={() => (markSeen(trip.id), go('find_trip', { link: { name: TRIP_LINK, id: trip.id } }))}
        />
      </>
    );
  }
  const { request } = plan;
  const open = () => go('my_trips', { link: { name: REQUEST_LINK, id: request.id } });
  if (plan.kind === 'offers') {
    const [first, second] = plan.offers;
    const time = (offer: Offer) => formatTime(new Date(offer.departAt));
    const times =
      first && second
        ? t('home.dock.offerTimes', { first: time(first), second: time(second) })
        : first
          ? time(first)
          : '';
    const who = plan.offers
      .map((offer) => `${offer.driver.firstName} · ${formatNumber(offer.price)}`)
      .join(', ');
    return (
      <>
        <DockCard
          chip={t('home.dock.offers', { count: String(plan.offers.length) })}
          title={`${words.day(first?.departAt ?? now)} ${times}`}
          text={who}
        />
        <MainButton text={t('home.dock.offersOpen')} onClick={() => openSheet('offer')} />
      </>
    );
  }
  const ends = requestEnds(request);
  return (
    <>
      <DockCard
        chip={t('home.request.title')}
        {...(ends - now < DAY_MS ? { timer: { text: words.left(ends), now: false } } : {})}
        title={t('home.dock.people', { when: words.day(ends - DAY_MS / 2), count: String(request.seats) })}
        text={
          request.views > 0
            ? t('home.meta', {
                when: words.route(request),
                more: t('home.dock.driversSaw', { count: String(request.views) }),
              })
            : words.route(request)
        }
      />
      <SecondaryButton beside text={t('home.dock.openRequest')} onClick={open} />
      <MainButton text={t('common.passenger.findTrip')} onClick={findTrip} />
    </>
  );
}
