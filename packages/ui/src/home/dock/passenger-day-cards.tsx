import { arrivalAt, type Booking } from '@platform/contracts';
import { useTripSteps } from '../../bookings/use-trip-steps';
import { useI18n } from '../../context/i18n-context';
import { ActionFailure } from '../../states/action-failure';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { useBookingEnds } from '../../trip/booking-ends';
import { DockCard } from './dock-card';
import type { DockWords } from './dock-words';
import { markStillOnWay } from './passenger-marks';
import type { SeatActions } from './seat-actions';

type Kind = 'meeting' | 'driverWaits' | 'onRoad' | 'arrivedAsk';
type Props = {
  readonly kind: Kind;
  readonly booking: Booking;
  readonly words: DockWords;
  readonly act: SeatActions;
  readonly onTold: () => void;
};

// The day of a seat (G76, mockup g76/2 states 9, 10, 12, 13): where to stand, the driver at the
// point with the ready words, on the road, the question after the arrival.
export function PassengerDayCard({ kind, booking, words, act, onTold }: Props) {
  const { t, formatTime } = useI18n();
  const ends = useBookingEnds(booking);
  const steps = useTripSteps(booking, onTold);
  const { trip } = booking;
  const driver = trip.driver;
  const car = words.car(driver.car, booking.plate);
  const tools = [
    { icon: 'phone' as const, label: t('sheet.meet.call'), onClick: act.call(booking) },
    {
      icon: 'chat' as const,
      label: t('chat.open'),
      dot: (booking.unread ?? 0) > 0,
      onClick: act.talk(booking),
    },
  ];
  const to = ends.regionName(trip.to);
  // Where exactly to stand at the pitak (the team writes it), else the region; the driver on the way
  // after «Yoʻlga chiqdim», without minutes (owner decision 10.10.2026: no live car, lesson 2).
  const where = booking.pitak?.hint ?? ends.regionName(trip.from);
  const onWay = t('home.dock.onWay', { name: driver.firstName });
  // On the way between «Yoʻlga chiqdim» and the driver's «Men keldim» at the point.
  const coming = trip.departedAt !== null && booking.driverCameAt === null;
  const meetText = coming ? t('home.meta', { when: where, more: onWay }) : where;
  const arrives = formatTime(new Date(arrivalAt(trip.departAt, trip.km)));
  // «Men keldim» at the point, red while the driver waits there (mockup g76/2 state 10). After it the
  // driver's «Keldi» puts the passenger in the car (G76, docs/43): until then the map stays.
  const came = booking.cameAt !== null;
  const main = (waits: boolean) =>
    came ? (
      <MainButton text={t('bookings.openMap')} onClick={act.map(booking)} />
    ) : (
      <MainButton text={t('bookings.meeting.came')} destructive={waits} onClick={act.came(booking)} />
    );
  switch (kind) {
    case 'meeting':
      return (
        <>
          <DockCard
            chip={words.when(trip.departAt)}
            tone="soon"
            timer={{ text: words.minutesTo(trip.departAt), now: false }}
            title={ends.start}
            text={meetText}
            who={{ person: driver, sub: car, tools }}
          />
          {came ? null : <SecondaryButton beside text={t('bookings.openMap')} onClick={act.map(booking)} />}
          {main(false)}
        </>
      );
    case 'driverWaits':
      return (
        <>
          <DockCard
            chip={t('home.dock.atPoint', { name: driver.firstName })}
            chipTone="red"
            tone="now"
            timer={{ text: words.waits(booking.driverCameAt ?? Date.now()), now: true }}
            title={ends.start}
            text={words.carToFind(driver.car, booking.plate)}
            who={{ person: driver, sub: car, tools }}
            quick={[
              { label: t('sheet.meet.five'), onClick: act.say(booking, 'five') },
              { label: t('sheet.meet.ten'), onClick: act.say(booking, 'ten') },
            ]}
          />
          <SecondaryButton beside text={t('sheet.meet.call')} onClick={act.call(booking)} />
          {main(true)}
        </>
      );
    case 'onRoad':
      return (
        <>
          <DockCard
            chip={t('driverTrip.onWay.title')}
            chipTone="green"
            title={t('home.dock.arriveBy', { place: to, time: arrives })}
            text={t('home.dock.with', { name: driver.firstName, count: String(trip.seats - trip.seatsLeft) })}
          />
          <SecondaryButton beside text={t('bookings.toClose')} onClick={act.share(booking)} />
          <MainButton text={t('share.arrived')} onClick={steps.step} />
          <ActionFailure error={steps.failure} />
        </>
      );
    case 'arrivedAsk':
      return (
        <>
          <DockCard
            chip={t('bookings.arrivedAsk.title')}
            title={t('home.dock.was', { place: to, time: arrives })}
            text={t('home.dock.answerCloses')}
          />
          <SecondaryButton
            beside
            text={t('bookings.arrivedAsk.later')}
            onClick={() => markStillOnWay(booking.id)}
          />
          <MainButton text={t('bookings.arrivedAsk.yes')} onClick={steps.step} />
          <ActionFailure error={steps.failure} />
        </>
      );
  }
}
