import type { Booking, Trip } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import { usePlaces } from '../../market/places-gate';
import { openSheet } from '../../action-sheet/action-queue';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { useBookingEnds } from '../../trip/booking-ends';
import { DockCard } from './dock-card';
import type { DockWords } from './dock-words';
import { PASSENGER_REQUESTS } from './driver-idle';
import { markOfferSeen } from './offer-seen';
import type { TripActions } from './trip-actions';

type Props = {
  readonly trip: Trip;
  readonly people: readonly Booking[];
  readonly words: DockWords;
  readonly act: TripActions;
  readonly go: HomeGo;
};

// A published trip (G76, mockup g76/3 state 6): the seats taken, the requests of its direction.
export function PublishedCard({ trip, words, act, go }: Props) {
  const { t } = useI18n();
  const directory = usePlaces();
  const seats = t('home.trip.seats', {
    taken: String(trip.seats - trip.seatsLeft),
    seats: String(trip.seats),
  });
  const board = () => go(PASSENGER_REQUESTS, { board: { from: trip.from, to: trip.to } });
  const known = directory.find(trip.from) !== undefined;
  return (
    <>
      <DockCard chip={words.when(trip.departAt)} title={seats} text={words.route(trip)} />
      {known ? <SecondaryButton beside text={t('home.dock.requestsSee')} onClick={board} /> : null}
      <MainButton text={t('home.dock.openTrip')} onClick={act.open(trip)} />
    </>
  );
}

// New requests on a trip (state 7): who and how many seats, the time to answer.
export function RequestsCard({ trip, people, words }: Props) {
  const { t } = useI18n();
  const waiting = people.filter((booking) => booking.status === 'requested');
  const [first] = [...waiting].sort((a, b) => a.expiresAt - b.expiresAt);
  const who = waiting
    .map((booking) =>
      t('home.dock.personSeats', { name: booking.passenger.firstName, count: String(booking.seats) }),
    )
    .join(', ');
  return (
    <>
      <DockCard
        chip={t('home.newRequests', { count: String(waiting.length) })}
        tone="soon"
        {...(first ? { timer: { text: words.left(first.expiresAt), now: false } } : {})}
        title={words.when(trip.departAt)}
        text={who}
      />
      <MainButton text={t('sheet.call.answer')} onClick={() => openSheet('request', first?.id ?? null)} />
    </>
  );
}

// A passenger took the offer of the driver (state 9): told until the driver opens the chat or the
// trip, a day at most (offer-seen).
export function AcceptedCard({ booking, words, act }: Omit<Props, 'people'> & { readonly booking: Booking }) {
  const { t } = useI18n();
  const ends = useBookingEnds(booking);
  const seen = (then: () => void) => () => {
    markOfferSeen(booking.id);
    then();
  };
  const chat = seen(act.chat(booking));
  const person = booking.passenger;
  const sub = t('home.dock.seatsOf', { count: String(booking.seats) });
  return (
    <>
      <DockCard
        chip={t('home.dock.accepted', { name: person.firstName })}
        chipTone="green"
        title={words.when(booking.trip.departAt)}
        text={`${ends.start}, ${words.route(booking.trip)}`}
        who={{ person, sub, tools: [{ icon: 'chat', label: t('chat.open'), onClick: chat }] }}
      />
      <SecondaryButton beside text={t('chat.open')} onClick={chat} />
      <MainButton text={t('home.dock.openTrip')} onClick={seen(act.open(booking.trip))} />
    </>
  );
}

// After the trip (state 16): the stars of the week and the way back.
export function EndedCard({ trip, people, words, act }: Props) {
  const { t, formatMoney } = useI18n();
  const riders = people.filter((booking) => booking.status === 'completed');
  const commission = riders.reduce((sum, booking) => sum + booking.commission, 0);
  return (
    <>
      <DockCard
        chip={t('bookings.done.title')}
        chipTone="green"
        timer={{ text: words.daysLeft(trip.departAt), now: false }}
        title={t('home.dock.rateRiders')}
        text={t('home.dock.riders', { count: String(riders.length), amount: formatMoney(commission) })}
      />
      <SecondaryButton beside text={t('driverTrip.row.back')} onClick={act.back(trip)} />
      <MainButton text={t('bookings.done.rate')} onClick={act.open(trip)} />
    </>
  );
}
