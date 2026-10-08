import { useI18n } from '../context/i18n-context';
import { usePlaceLabel } from '../market/places-gate';
import { useNameText } from '../way/way-end';
import type { Stop } from './driver-stops';

type Props = {
  readonly stop: Stop;
  readonly number: number;
  // The district of the trip end the point is in: «Grand yaqinida, Chilonzor».
  readonly place: string;
  // The meeting of the point (screen 13); null: the card only shows the point.
  readonly onOpen: (() => void) | null;
};

// A point of «Safar xaritasi» (mockup g63/4 screen 12): its number, who gets in there and how many
// seats, the place. The people of one pitak share one card.
export function StopCard({ stop, number, place, onOpen }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const district = usePlaceLabel()(place).name;
  const names = stop.riders.map((rider) => rider.passenger.firstName).join(', ');
  const seats = stop.riders.reduce((sum, rider) => sum + rider.seats, 0);
  // A pitak is known by its own name; a door by the place near it and the district.
  const where = stop.name ? `${nameText(stop.name, stop.who)}, ${district}` : stop.who;
  const body = (
    <>
      <span className="trip-map-number">{number}</span>
      <span className="trip-map-who">
        <b>{`${names} · ${t('bookings.card.seats', { seats: String(seats) })}`}</b>
        <span>{where}</span>
      </span>
    </>
  );
  return onOpen ? (
    <button type="button" className="trip-map-stop" onClick={onOpen}>
      {body}
    </button>
  ) : (
    <div className="trip-map-stop">{body}</div>
  );
}
