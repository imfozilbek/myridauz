import { arrivalAt } from '@platform/contracts';
import { Timeline } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { usePlaceLabel, type PlaceLabel } from './places-gate';

type RouteViewProps = {
  readonly from: string;
  readonly to: string;
  // With the departure and the distance the stops show the time: "12:30" and "≈ 17:30".
  readonly departAt?: number;
  readonly km?: number;
};

// Point A and point B, each as the place and its region (docs/14, owner decision 29.09.2026).
export function RouteView({ from, to, departAt, km }: RouteViewProps) {
  const { t, formatTime } = useI18n();
  const place = usePlaceLabel();
  const time = (ms: number) => formatTime(new Date(ms));
  const departs = departAt === undefined ? undefined : time(departAt);
  const arrives =
    departAt === undefined || km === undefined
      ? undefined
      : t('market.trip.arrival', { time: time(arrivalAt(departAt, km)) });
  return (
    <Timeline active={1} className="route">
      <Timeline.Item header={place(from).name}>
        <Stop label={place(from)} time={departs} />
      </Timeline.Item>
      <Timeline.Item header={place(to).name}>
        <Stop label={place(to)} time={arrives} />
      </Timeline.Item>
    </Timeline>
  );
}

function Stop({ label, time }: { readonly label: PlaceLabel; readonly time: string | undefined }) {
  return (
    <span className="route-stop">
      <span>{label.area}</span>
      {time ? <span className="route-time">{time}</span> : null}
    </span>
  );
}
