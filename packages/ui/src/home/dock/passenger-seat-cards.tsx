import type { Booking } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import type { PlaceDirectory } from '../../places/directory';
import { useBookingEnds } from '../../trip/booking-ends';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { DockCard } from './dock-card';
import type { DockWords } from './dock-words';
import { markAgreed } from './passenger-marks';
import type { SeatActions } from './seat-actions';

type Kind = 'asked' | 'confirmed' | 'moved' | 'refused' | 'noShow' | 'ended';
type Props = {
  readonly kind: Kind;
  readonly booking: Booking;
  readonly words: DockWords;
  readonly act: SeatActions;
  readonly go: HomeGo;
  readonly directory: PlaceDirectory;
};

// A seat before and after its day (G76, mockup g76/2 states 6, 7, 8, 11, 14, 15).
export function PassengerSeatCard({ kind, booking, words, act, go, directory }: Props) {
  const { t, formatTime } = useI18n();
  const { trip } = booking;
  const driver = trip.driver;
  const tools = [
    { icon: 'phone' as const, label: t('sheet.meet.call'), onClick: act.call(booking) },
    {
      icon: 'chat' as const,
      label: t('chat.open'),
      dot: (booking.unread ?? 0) > 0,
      onClick: act.talk(booking),
    },
  ];
  const who = { person: driver, sub: words.car(driver.car, booking.plate), tools };
  const route = words.route(trip);
  const start = useBookingEnds(booking).start;
  const ends = { from: directory.find(trip.from), to: directory.find(trip.to) };
  const again = (back: boolean) => () => {
    const { from, to } = ends;
    if (from && to) go('find_trip', { route: back ? { from: to, to: from } : { from, to } });
  };
  switch (kind) {
    case 'asked':
      return (
        <>
          <DockCard
            chip={t('bookings.status.requested')}
            chipTone="gray"
            timer={{ text: words.left(booking.expiresAt), now: false }}
            title={words.when(trip.departAt)}
            text={route}
            who={{ ...who, tools: tools.slice(1) }}
          />
          <SecondaryButton beside text={t('home.dock.cancel')} onClick={act.cancel(booking)} />
          <MainButton text={t('chat.open')} onClick={act.chat(booking)} />
        </>
      );
    case 'confirmed':
      return (
        <>
          <DockCard
            chip={t('bookings.confirmed.title')}
            chipTone="green"
            title={words.when(trip.departAt)}
            text={`${start}, ${route}`}
            who={who}
          />
          <SecondaryButton beside text={t('sheet.meet.call')} onClick={act.call(booking)} />
          <MainButton text={t('home.dock.openTrip')} onClick={act.open(booking)} />
        </>
      );
    case 'moved': {
      const times = `${formatTime(new Date(trip.firstDepartAt))} → ${formatTime(new Date(trip.departAt))}`;
      return (
        <>
          <DockCard
            chip={t('home.dock.moved')}
            tone="soon"
            title={times}
            text={t('home.dock.movedHint', { when: words.day(trip.departAt), route })}
            who={{ ...who, tools: [] }}
          />
          <SecondaryButton beside text={t('bookings.disagree')} onClick={act.cancel(booking)} />
          <MainButton text={t('home.dock.agree')} onClick={() => markAgreed(booking.id)} />
        </>
      );
    }
    case 'refused':
      return (
        <>
          <DockCard
            chip={t('bookings.offer.status.declined')}
            chipTone="red"
            tone="off"
            title={words.when(trip.departAt)}
            text={t('home.dock.refusedHint')}
          />
          <SecondaryButton
            beside
            text={t('common.passenger.leaveRequest')}
            onClick={() =>
              go('leave_request', {
                ...(ends.from ? { from: ends.from } : {}),
                ...(ends.to ? { to: ends.to } : {}),
              })
            }
          />
          <MainButton text={t('bookings.others')} onClick={again(false)} />
        </>
      );
    case 'noShow':
      return (
        <>
          <DockCard
            chip={t('home.dock.noShow')}
            chipTone="red"
            tone="off"
            title={words.when(trip.departAt)}
            text={t('home.dock.noShowHint')}
          />
          <SecondaryButton beside text={t('chat.open')} onClick={act.chat(booking)} />
          <MainButton text={t('home.support')} onClick={act.support} />
        </>
      );
    case 'ended':
      return (
        <>
          <DockCard
            chip={t('bookings.done.title')}
            chipTone="green"
            timer={{ text: words.daysLeft(trip.departAt), now: false }}
            title={t('home.dock.rate', { name: driver.firstName })}
            text={t('home.dock.rateHint')}
            who={{ ...who, tools: [] }}
          />
          <SecondaryButton beside text={t('home.comeBack')} onClick={again(true)} />
          <MainButton text={t('bookings.done.rate')} onClick={act.open(booking)} />
        </>
      );
  }
}
