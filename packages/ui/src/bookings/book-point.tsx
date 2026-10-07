import { zoneOf, type Pitak } from '@platform/contracts';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { PointScreen } from '../way/point-screen';
import type { WayEnd } from '../way/way-end';

type Props = {
  // The place of the trip at this end: the point lies in its zone (G26, docs/74).
  readonly placeId: string;
  readonly end: 'from' | 'to';
  // Back from the next step, the point chosen before: the map opens on it (docs/94 F8).
  readonly initial: WayEnd | null;
  readonly onBack: () => void;
  readonly onPick: (end: WayEnd) => void;
  // The pitak of the trip as one more start, taken in one tap (G59).
  readonly pitak?: Pitak;
  readonly onPitak?: () => void;
};

// A point of a booking: the map, the search and the last places stay inside the zone of the
// trip (its district, or the whole city of Toshkent); the server checks the same.
export function BookPoint({ placeId, end, initial, onBack, onPick, pitak, onPitak }: Props) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={onBack} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={onBack} />;
  const { find } = state.directory;
  const place = find(placeId);
  const zone = place ? find(zoneOf(place, find)) : undefined;
  if (!zone) return <ErrorScreen onRetry={retry} onBack={onBack} />;
  return (
    <PointScreen
      title={end === 'from' ? 'way.point.from' : 'way.point.to'}
      start={initial?.point ?? { lat: zone.lat, lng: zone.lng }}
      find={find}
      zone={zone}
      findMe={end === 'from' && !initial}
      end={end}
      {...(pitak && onPitak ? { pitak, onPitak } : {})}
      onBack={onBack}
      onPick={onPick}
    />
  );
}
