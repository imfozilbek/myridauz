import type { Booking, Trip } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import { useTripSteps } from '../../own-trip/use-trip-steps';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { useBookingEnds } from '../../trip/booking-ends';
import { DockCard } from './dock-card';
import type { DockWords } from './dock-words';
import type { TripActions } from './trip-actions';

type Props = {
  readonly trip: Trip;
  readonly people: readonly Booking[];
  readonly words: DockWords;
  readonly act: TripActions;
  readonly onChanged: () => void;
};

// The hour before the trip (G76, mockup g76/3 states 11 and 15): «Yoʻlga chiqdim», and asked when
// the time passed without it.
export function DepartCard({
  trip,
  people,
  words,
  act,
  onChanged,
  late,
}: Props & { readonly late: boolean }) {
  const { t } = useI18n();
  const steps = useTripSteps({ trip, onChanged, onArrived: onChanged });
  const riders = people.filter((booking) => booking.status === 'confirmed').length;
  const together = t('home.meta', {
    when: t('home.day.people', { count: String(riders) }),
    more: t('home.day.allConfirmed'),
  });
  const go = <MainButton text={t('driverTrip.main.departed')} onClick={() => void steps.step('departed')} />;
  if (late)
    return (
      <>
        <DockCard
          chip={t('home.dock.departAsk')}
          tone="soon"
          title={t('home.dock.wasAt', { when: words.when(trip.departAt) })}
          text={t('home.dock.departAskHint')}
        />
        <SecondaryButton beside text={t('home.dock.late')} onClick={act.open(trip)} />
        {go}
      </>
    );
  return (
    <>
      <DockCard
        chip={words.when(trip.departAt)}
        tone="soon"
        timer={{ text: words.minutesTo(trip.departAt), now: false }}
        title={words.route(trip)}
        text={together}
      />
      <SecondaryButton beside text={t('driverTrip.tile.map')} onClick={act.open(trip)} />
      {go}
    </>
  );
}

// A passenger at the point (states 12 and 13): waiting for the driver, then «Keldi» or «Kelmadi».
export function PointCard({
  booking,
  words,
  act,
  waiting,
}: {
  readonly booking: Booking;
  readonly words: DockWords;
  readonly act: TripActions;
  readonly waiting: boolean;
}) {
  const { t } = useI18n();
  const ends = useBookingEnds(booking);
  const person = booking.passenger;
  const sub = t('home.dock.seatsOf', { count: String(booking.seats) });
  const phone = { icon: 'phone' as const, label: t('sheet.meet.call'), onClick: act.call(booking) };
  const chat = {
    icon: 'chat' as const,
    label: t('chat.open'),
    dot: act.unread(booking),
    onClick: act.talk(booking),
  };
  if (waiting)
    return (
      <>
        <DockCard
          chip={t('home.dock.atPoint', { name: person.firstName })}
          chipTone="red"
          tone="now"
          timer={{ text: words.waits(booking.cameAt ?? Date.now()), now: true }}
          title={ends.start}
          text={booking.note ?? words.route(booking.trip)}
          who={{ person, sub, tools: [phone, chat] }}
          quick={[
            { label: t('sheet.meet.five'), onClick: act.say(booking, 'five') },
            { label: t('sheet.meet.ten'), onClick: act.say(booking, 'ten') },
          ]}
        />
        <SecondaryButton beside text={t('sheet.meet.call')} onClick={act.call(booking)} />
        <MainButton text={t('bookings.meeting.came')} destructive onClick={act.came(booking)} />
      </>
    );
  return (
    <>
      <DockCard
        chip={t('sheet.meet.kicker')}
        chipTone="green"
        tone="soon"
        timer={{ text: words.waits(booking.driverCameAt ?? Date.now()), now: false }}
        title={ends.start}
        text={t('home.dock.markHint', { name: person.firstName })}
        who={{ person, sub, tools: [phone] }}
      />
      <SecondaryButton beside text={t('complaints.reason.no_show')} onClick={act.missed(booking)} />
      <MainButton text={t('driverAfter.meet.met')} onClick={act.met(booking)} />
    </>
  );
}
