import type { Point, SharedTrip } from '@platform/contracts';
import { mapUrl } from '../bookings/map-link';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import { openExternal } from '../telegram/feedback';
import { DriverRow } from '../trip/driver-row';

// The driver and the two places of a shared trip (mockup g60/3): a place opens in a map. No phone
// numbers here, ever (docs/07, docs/43).
const FACE = 44;

export function FollowDriver({ trip }: { readonly trip: SharedTrip }) {
  const { t, formatTime } = useI18n();
  const directory = usePlaces();
  const { driver } = trip;
  const name = (id: string) => directory.find(id)?.name ?? '';
  const place = (kind: 'from' | 'to', title: string, note: string, point: Point | null) => (
    <button
      type="button"
      className="follow-place"
      disabled={!point}
      onClick={() => (point ? openExternal(mapUrl(point)) : undefined)}
    >
      <span className={`follow-place-tile follow-place-${kind}`}>
        <Icon name="destination" size={22} />
      </span>
      <span className="follow-place-text">
        <span>{title}</span>
        <span className="follow-place-note">{note}</span>
      </span>
      {point ? <Icon name="next" size={14} /> : null}
    </button>
  );
  return (
    <div className="follow-card">
      <DriverRow
        driver={{ id: '', firstName: driver.firstName, hasAvatar: false }}
        car={driver.car}
        note={`· ${t('share.follow.role')}`}
        plate={trip.plate}
        photo={FACE}
      />
      {place(
        'from',
        t('share.follow.meeting'),
        `${name(trip.from)} · ${formatTime(new Date(trip.departAt))}`,
        trip.meetingPoint,
      )}
      {place('to', t('way.book.dropoff'), name(trip.to), trip.dropoffPoint)}
    </div>
  );
}
