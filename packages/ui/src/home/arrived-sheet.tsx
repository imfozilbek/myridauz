import { arrivalAt, type Booking } from '@platform/contracts';
import { useState } from 'react';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Button, Modal } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { useDirectory } from '../places/use-directory';
import './arrived-sheet.css';

const HOUR_MS = 60 * 60 * 1000;
const PHOTO = 72;

// A confirmed seat an hour after its arrival, not told yet: one sheet at a time (docs/122).
export const asksArrival = (booking: Booking, now: number) =>
  booking.status === 'confirmed' &&
  booking.arrivedAt === null &&
  now >= arrivalAt(booking.trip.departAt, booking.trip.km) + HOUR_MS;

// An hour after the arrival the passenger who has not told it is asked (docs/129, docs/43,
// mockup g60/6): one tap tells the close people too; «Hali yoʻldaman» leaves it for now.
export function ArrivedSheet({
  bookings,
  onTold,
}: {
  readonly bookings: readonly Booking[];
  readonly onTold: () => void;
}) {
  const [later, setLater] = useState<readonly string[]>([]);
  const due = bookings.find((booking) => asksArrival(booking, Date.now()) && !later.includes(booking.id));
  return (
    <Modal
      open={due !== undefined}
      onOpenChange={(open) => (open || !due ? undefined : setLater([...later, due.id]))}
    >
      {due ? <Ask booking={due} onLater={() => setLater([...later, due.id])} onTold={onTold} /> : null}
    </Modal>
  );
}

type AskProps = { readonly booking: Booking; readonly onLater: () => void; readonly onTold: () => void };

function Ask({ booking, onLater, onTold }: AskProps) {
  const { t, formatTime } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const { failure, fail, clear } = useFailure();
  const [places] = useDirectory();
  const { passenger, trip } = booking;
  const end = places.status === 'ready' ? (places.directory.find(trip.to)?.name ?? '') : '';
  const arrived = async () => {
    clear();
    try {
      await chat.arrived(booking.id);
      haptic.success();
      track({ name: 'arrived', screen: 'home.passenger' });
      onTold();
    } catch (caught) {
      fail(caught);
    }
  };
  return (
    <div className="arrived-sheet">
      <ProfilePhoto
        userId={passenger.id}
        name={passenger.firstName}
        hasAvatar={passenger.hasAvatar}
        size={PHOTO}
      />
      <span className="arrived-kicker">{t('bookings.arrivedAsk.kicker', { name: passenger.firstName })}</span>
      <b className="arrived-title">{t('bookings.arrivedAsk.title')}</b>
      <span className="arrived-sub">
        {t('bookings.arrivedAsk.when', {
          place: end,
          time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
        })}
      </span>
      <ActionFailure error={failure} />
      <Button size="l" stretched onClick={() => void arrived()}>
        {t('bookings.arrivedAsk.yes')}
      </Button>
      <Button size="l" mode="gray" stretched onClick={onLater}>
        {t('bookings.arrivedAsk.later')}
      </Button>
      <span className="arrived-foot">{t('bookings.arrivedAsk.close')}</span>
    </div>
  );
}
