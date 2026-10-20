import { arrivalAt } from '@platform/contracts';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { useTripTime } from '../trip/trip-time';
import { usePlaceLabel, type PlaceLabel } from './places-gate';
import './route-view.css';

const MARK_SIZE = 20;

type RouteViewProps = {
  readonly from: string;
  readonly to: string;
  // With the departure and the distance the stops show the time: "12:30" and "≈ 17:30".
  readonly departAt?: number;
  // The end of a range (G90): the start shows «08:00 … 10:00» and the end no arrival.
  readonly departUntil?: number | null;
  readonly km?: number;
  // The points of a seat in place of the ends of the trip (G78 sheet 3, d-seat).
  readonly ends?: { readonly from: PlaceLabel; readonly to: PlaceLabel };
};

// Point A (green) and point B (red), each as the place and its region (docs/14, owner decision 29.09.2026).
export function RouteView({ from, to, departAt, departUntil = null, km, ends }: RouteViewProps) {
  const { t, formatTime } = useI18n();
  const tripTime = useTripTime();
  const { colors } = useBrand().theme;
  const place = usePlaceLabel();
  const departs = departAt === undefined ? undefined : tripTime({ departAt, departUntil });
  const arrives =
    departAt === undefined || km === undefined || departUntil !== null
      ? undefined
      : t('market.trip.arrival', { time: formatTime(new Date(arrivalAt(departAt, km))) });
  return (
    <div className="route">
      <Stop icon="origin" color={colors.routeFrom} label={ends?.from ?? place(from)} time={departs} />
      <Stop icon="destination" color={colors.routeTo} label={ends?.to ?? place(to)} time={arrives} />
    </div>
  );
}

type StopProps = {
  readonly icon: IconName;
  readonly color: string;
  readonly label: PlaceLabel;
  readonly time: string | undefined;
};

function Stop({ icon, color, label, time }: StopProps) {
  return (
    <div className="route-stop">
      <span className="route-mark">
        <Icon name={icon} size={MARK_SIZE} color={color} />
      </span>
      <span className="route-place">
        <Text weight="2">{label.name}</Text>
        <Caption className="trip-card-hint">{label.area}</Caption>
      </span>
      {time ? (
        <Text weight="2" className="route-time">
          {time}
        </Text>
      ) : null}
    </div>
  );
}
