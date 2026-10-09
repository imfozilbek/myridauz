import { formatPlate, tashkentDate, type Booking } from '@platform/contracts';
import { useState } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon, type IconName } from '../icons';
import { useShortDay } from '../market/when';
import type { PlaceDirectory } from '../places/directory';
import { usePlaceNames } from '../places/place-names';
import { brandVars } from '../theme/brand-vars';
import './home-trip-card.css';

const FACE = 38;
const LETTER = 16;
const TOOL = 18;
const ARROW = 14;

type Props = {
  readonly booking: Booking;
  readonly directory: PlaceDirectory | null;
  readonly onOpen: () => void;
  readonly onTalk: (screen: 'chat' | 'call') => void;
};

// The seat of the passenger on the main screen (G66, docs/118, mockup g66/1 phone 3): when and its
// state, the driver and where to, the car and its plate; the chat and the call one tap away.
export function HomeTripCard({ booking, directory, onOpen, onTalk }: Props) {
  const { t, formatTime } = useI18n();
  const { colors } = useBrand().theme;
  const names = usePlaceNames(directory);
  const shortDay = useShortDay();
  const [now] = useState(Date.now);
  const { driver, departAt } = booking.trip;
  const to = directory?.find(booking.trip.to);
  const confirmed = booking.status === 'confirmed';
  const when = t('home.trip.when', {
    day: shortDay(tashkentDate(departAt), now),
    time: formatTime(new Date(departAt)),
  });
  const state = t(confirmed ? 'bookings.confirmed.title' : 'bookings.status.requested');
  const car = t('home.trip.car', { model: driver.car.model, color: t(`drivers.color.${driver.car.color}`) });
  const tool = (screen: 'chat' | 'call', icon: IconName, label: string) => (
    <button type="button" className="home-trip-tool" aria-label={label} onClick={() => onTalk(screen)}>
      <Icon name={icon} size={TOOL} color={colors.brandText} />
    </button>
  );
  return (
    <section className={confirmed ? 'home-trip' : 'home-trip home-trip-waiting'} style={brandVars(colors)}>
      <button type="button" className="home-trip-open" onClick={onOpen}>
        <span className="home-trip-top">
          <span className="home-trip-pill">{t('home.meta', { when, more: state })}</span>
          <Icon name="next" size={ARROW} color={colors.textMuted} />
        </span>
        <span className="home-trip-who">
          <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={FACE} letter={LETTER} plain />
          <span className="home-trip-words">
            <span className="home-trip-name">
              {to ? t('home.meta', { when: driver.firstName, more: names.toward(to) }) : driver.firstName}
            </span>
            <span className="home-trip-car">
              {booking.plate ? t('home.meta', { when: car, more: formatPlate(booking.plate) }) : car}
            </span>
          </span>
        </span>
      </button>
      <span className="home-trip-tools">
        {tool('chat', 'chat', t('chat.open'))}
        {confirmed ? tool('call', 'phone', t('calls.call')) : null}
      </span>
    </section>
  );
}
